import { defineApp } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { changelogRoute, aboutRoute, termsRoute } from "@/app/pages/staticRoutes";
import { initAuth } from "@/lib/auth";
import { type Organization } from "@/db";
import {
  initializeServices,
  setupOrganizationContext,
  setupSessionContext,
  extractOrgFromSubdomain,
  shouldSkipMiddleware,
} from "@/lib/middlewareFunctions";
import { env } from "cloudflare:workers";
import { verifyTurnstileToken } from "@/lib/turnstile";
import OrgNotFoundPage from "@/app/pages/errors/OrgNotFoundPage";
import NoAccessPage from "@/app/pages/errors/NoAccessPage";
import LandingPage from "@/app/pages/landing/LandingPage";

// ── FlareUp imports ───────────────────────────────────────────────────────────
import DashboardPage from "@/app/pages/dashboard/DashboardPage";
import {
  handleConnect,
  handleDisconnect,
  handleUsage,
  handleStatus,
} from "@/app/api/cf/index";
import {
  handleGetConfig,
  handleSaveConfig,
  handleTestWebhook,
} from "@/app/api/alerts/index";
import { getAlertConfig, evaluateAndAlert } from "@/lib/alerts/config";
import { fetchAllUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd } from "@/lib/cf/pricing";

// ── Durable Object exports ────────────────────────────────────────────────────
export { SessionDurableObject } from "./session/durableObject";
export { UserSessionDO } from "./durableObjects/userSessionDO";

// ── App context type ──────────────────────────────────────────────────────────
export type AppContext = {
  session: any | null;
  user: any | null;
  organization: Organization | null;
  userRole: string | null;
  orgError: "ORG_NOT_FOUND" | "NO_ACCESS" | "ERROR" | null;
};

// ── URL normalization ─────────────────────────────────────────────────────────
function normalizeUrl(request: Request): Response | null {
  const url = new URL(request.url);
  const PRIMARY_DOMAIN = (env as any).PRIMARY_DOMAIN || "example.com";
  const isLocalhost = url.hostname.includes("localhost");

  if (isLocalhost) return null;

  let shouldRedirect = false;
  let newHostname = url.hostname;
  let newProtocol = url.protocol;

  if (url.protocol === "http:") {
    newProtocol = "https:";
    shouldRedirect = true;
  }

  if (url.hostname === `www.${PRIMARY_DOMAIN}`) {
    newHostname = PRIMARY_DOMAIN;
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: `${newProtocol}//${newHostname}${url.pathname}${url.search}${url.hash}`,
      },
    });
  }

  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default defineApp([
  setCommonHeaders(),

  // 1. URL normalization — always first
  async ({ request }) => {
    const redirect = normalizeUrl(request);
    if (redirect) return redirect;
  },

  /**
   * ⚠️ CRITICAL MIDDLEWARE CHAIN — DO NOT REORDER ⚠️
   * Sets up ctx.user, ctx.organization, ctx.userRole on every request.
   * See original comments for full context.
   */
  async ({ ctx, request }) => {
    try {
      await initializeServices();

      if (shouldSkipMiddleware(request)) return;

      await setupSessionContext(ctx, request);
      await setupOrganizationContext(ctx, request);

      const { autoCreateOrgMiddleware } = await import(
        "@/lib/middleware/autoCreateOrgMiddleware"
      );
      const result = await autoCreateOrgMiddleware(ctx, request);
      if (result) return result;

      if (
        ctx.orgError &&
        !request.url.includes("/api/") &&
        !request.url.includes("/__") &&
        !request.url.includes("/user/") &&
        !request.url.includes("/orgs/new")
      ) {
        const url = new URL(request.url);
        const mainDomain = url.hostname.includes("localhost")
          ? "localhost:5173"
          : (env as any).PRIMARY_DOMAIN || "example.com";

        if (ctx.orgError === "ORG_NOT_FOUND") {
          const orgSlug = extractOrgFromSubdomain(request);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${url.protocol}//${mainDomain}/orgs/new?suggested=${orgSlug}`,
            },
          });
        }

        if (ctx.orgError === "NO_ACCESS") {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      }
    } catch (error) {
      console.error("Middleware error:", error);
      ctx.session = null;
      ctx.user = null;
      ctx.organization = null;
      ctx.userRole = null;
      ctx.orgError = null;
    }
  },

  // ── WebSocket DO ────────────────────────────────────────────────────────────
  route("/__user-session", async ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const id = (env as any).USER_SESSION_DO.idFromName(userId);
    const stub = (env as any).USER_SESSION_DO.get(id);
    return stub.fetch(request);
  }),

  // ── FlareUp API routes ──────────────────────────────────────────────────────
  prefix("/api/cf", [
    route("/connect", async ({ request }) => {
      if (request.method === "DELETE") return handleDisconnect(request);
      return handleConnect(request);
    }),
    route("/status", async ({ request }) => handleStatus(request)),
    route("/usage",  async ({ request }) => handleUsage(request)),
  ]),

  prefix("/api/alerts", [
    route("/config", async ({ request }) => {
      if (request.method === "GET") return handleGetConfig();
      return handleSaveConfig(request);
    }),
    route("/test-webhook", async ({ request }) => handleTestWebhook(request)),
  ]),

  // ── Existing API routes ─────────────────────────────────────────────────────
  prefix("/api", [
    route("/stripe/create-checkout", async ({ request, ctx }) => {
      const { default: handler } = await import("@/app/api/stripe/create-checkout");
      return handler({ request, ctx } as any);
    }),

    route("/auth/*", async ({ request }) => {
      try {
        if (request.url.includes("/sign-up") && request.method === "POST") {
          const body = await request.clone().json() as any;
          if (body.turnstileToken) {
            const isValid = await verifyTurnstileToken(body.turnstileToken);
            if (!isValid) {
              return new Response(
                JSON.stringify({ error: "Bot protection verification failed" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
          }
        }
        await initializeServices();
        const authInstance = initAuth();
        return await authInstance.handler(request);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Auth failed", message: String(error) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }),

    route("/webhooks/:service", async ({ request, params, ctx }) => {
      if (params.service === "stripe") {
        const { default: handler } = await import("@/app/api/webhooks/stripe-wh");
        return handler({ request });
      }
      if (params.service === "lemonsqueezy") {
        const { default: handler } = await import("@/app/api/webhooks/lemonsqueezy-wh");
        return handler({ request, ctx });
      }
      return Response.json({ error: "Webhook not supported" }, { status: 404 });
    }),

    route("*", async ({ request, params, ctx }) => {
      const apiPath = params.$0;
      if (!apiPath) {
        return new Response(
          JSON.stringify({ error: "API endpoint not specified" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      try {
        const handler = await import(/* @vite-ignore */ `@/app/api/${apiPath}`);
        return await handler.default({ request, ctx, params, method: request.method });
      } catch (error: any) {
        if (error.message?.includes("Cannot resolve module")) {
          return new Response(
            JSON.stringify({ error: "API endpoint not found", path: `/api/${apiPath}` }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "Internal server error", message: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }),
  ]),

  // ── Frontend routes ─────────────────────────────────────────────────────────
  render(Document, [
    route("/org-not-found", OrgNotFoundPage),
    route("/no-access", NoAccessPage),

    prefix("/user", userRoutes),

    changelogRoute,
    aboutRoute,
    termsRoute,

    // ── FlareUp pages ─────────────────────────────────────────────────────────
    route("/dashboard", async ({ request }) => <DashboardPage request={request} />),
    route("/alerts",    async ({ request }) => {
      // TODO: AlertsConfigPage — for now redirect to dashboard
      return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
    }),

    route("/", [
      ({ ctx, request }) => {
        const url = new URL(request.url);
        if (url.pathname !== "/") return;

        const orgSlug = extractOrgFromSubdomain(request);
        if (!orgSlug) return;

        if (ctx.orgError) return;

        if (ctx.organization && (!ctx.user || !ctx.userRole)) {
          return new Response(null, { status: 302, headers: { Location: "/user/login" } });
        }

        if (ctx.organization && ctx.user && ctx.userRole) {
          return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
        }
      },
      LandingPage,
    ]),

    route("/*", ({ request }) => {
      const url = new URL(request.url);
      if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/__") ||
        url.pathname.startsWith("/webhooks/")
      ) {
        return;
      }
      return new Response(null, { status: 301, headers: { Location: "/" } });
    }),
  ]),
]);

// ── FlareUp cron handler ──────────────────────────────────────────────────────
/**
 * Scheduled monitoring — runs on a cron trigger.
 * Reads CF_API_TOKEN + CF_ACCOUNT_ID from Worker secrets,
 * fetches usage, evaluates alert rules, fires webhooks.
 *
 * Add to wrangler.jsonc:
 *   "triggers": {
 *     "crons": ["*\/5 * * * *", "0 * * * *", "0 0 * * *"]
 *   }
 *
 * Cron 1 (every 5 min):  spike detection
 * Cron 2 (every hour):   burn rate + month projection
 * Cron 3 (daily 00:00):  full report webhook
 */
export const scheduled = async (
  event: ScheduledEvent,
  env: any,
  _ctx: ExecutionContext
) => {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;

  // If no server-side token configured, skip silently
  // (user is relying on browser session only)
  if (!token || !accountId) return;

  try {
    const [usage, alertConfig] = await Promise.all([
      fetchAllUsage({ token, accountId }),
      getAlertConfig(env.ALERT_CONFIG_KV),
    ]);

    const w   = usage.workers.status        === "ok" ? usage.workers.data        : { requests: 0, cpuTimeMs: 0 };
    const ai  = usage.workersAI.status      === "ok" ? usage.workersAI.data      : { neurons: 0, requests: 0, byModel: [] };
    const kv  = usage.kv.status             === "ok" ? usage.kv.data             : { reads: 0, writes: 0, deletes: 0, lists: 0 };
    const d1  = usage.d1.status             === "ok" ? usage.d1.data             : { rowsRead: 0, rowsWritten: 0 };
    const r2  = usage.r2.status             === "ok" ? usage.r2.data             : { classAOps: 0, classBOps: 0, storageGB: 0 };
    const doU = usage.durableObjects.status === "ok" ? usage.durableObjects.data : { requests: 0, durationMs: 0 };
    const q   = usage.queues.status         === "ok" ? usage.queues.data         : { operations: 0 };

    const costs = estimateCosts({ workers: w, workersAI: ai, kv, d1, r2, durableObjects: doU, queues: q });
    const projected = projectMonthEnd(costs);

    await evaluateAndAlert(alertConfig, projected.total, costs.total);
  } catch (err) {
    console.error("FlareUp cron error:", err);
  }
};