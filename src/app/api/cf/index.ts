/**
 * /api/cf/* routes
 *
 * POST /api/cf/connect  — validate token, create encrypted session cookie
 * DELETE /api/cf/connect — clear session (logout)
 * GET  /api/cf/usage    — fetch all product usage (requires session)
 * GET  /api/cf/status   — check if session is active
 */

import { verifyToken, fetchAllUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd } from "@/lib/cf/pricing";
import {
  encryptSession,
  decryptSession,
  makeSessionCookie,
  clearSessionCookie,
  getSessionCookie,
  type SessionData,
} from "@/lib/session";
import { env } from "cloudflare:workers";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function getSession(request: Request): Promise<SessionData | null> {
  const cookie = getSessionCookie(request);
  if (!cookie) return null;
  const secret = (env as any).APP_SECRET;
  if (!secret) throw new Error("APP_SECRET not configured");
  return decryptSession(cookie, secret);
}

// POST /api/cf/connect
export async function handleConnect(request: Request): Promise<Response> {
  if (request.method !== "POST") return err("Method not allowed", 405);

  let body: { token?: string; accountId?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }

  const { token, accountId } = body;
  if (!token || !accountId) {
    return err("Missing token or accountId");
  }

  try {
    // Verify token is valid + read-only
    const tokenInfo = await verifyToken(token);

    const secret = (env as any).APP_SECRET;
    if (!secret) return err("Server misconfigured: APP_SECRET missing", 500);

    const session: SessionData = {
      token,
      accountId,
      tokenId: tokenInfo.id,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    const encrypted = await encryptSession(session, secret);
    const cookie = makeSessionCookie(encrypted);

    return new Response(
      JSON.stringify({
        ok: true,
        tokenId: tokenInfo.id,
        expiresAt: session.expiresAt,
        message: "Connected. Token verified as read-only.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (e: any) {
    // Return specific, actionable error messages to help users fix their token
    return err(e.message ?? "Failed to verify token", 401);
  }
}

// DELETE /api/cf/connect
export async function handleDisconnect(request: Request): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}

// GET /api/cf/status
export async function handleStatus(request: Request): Promise<Response> {
  try {
    const session = await getSession(request);
    if (!session) return json({ connected: false });
    if (Date.now() > session.expiresAt) return json({ connected: false, reason: "expired" });
    return json({
      connected: true,
      tokenId: session.tokenId,
      expiresAt: session.expiresAt,
    });
  } catch {
    return json({ connected: false });
  }
}

// GET /api/cf/usage
export async function handleUsage(request: Request): Promise<Response> {
  if (request.method !== "GET") return err("Method not allowed", 405);

  let session: SessionData | null;
  try {
    session = await getSession(request);
  } catch (e: any) {
    return err(e.message, 500);
  }

  if (!session) return err("Not connected. Please add your CF token.", 401);
  if (Date.now() > session.expiresAt) return err("Session expired. Please reconnect.", 401);

  try {
    const usage = await fetchAllUsage({
      token: session.token,
      accountId: session.accountId,
    });

    const w   = usage.workers.status        === "ok" ? usage.workers.data        : { requests: 0, cpuTimeMs: 0 };
    const ai  = usage.workersAI.status      === "ok" ? usage.workersAI.data      : { neurons: 0, requests: 0, byModel: [] };
    const kv  = usage.kv.status             === "ok" ? usage.kv.data             : { reads: 0, writes: 0, deletes: 0, lists: 0 };
    const d1  = usage.d1.status             === "ok" ? usage.d1.data             : { rowsRead: 0, rowsWritten: 0 };
    const r2  = usage.r2.status             === "ok" ? usage.r2.data             : { classAOps: 0, classBOps: 0, storageGB: 0 };
    const doU = usage.durableObjects.status === "ok" ? usage.durableObjects.data : { requests: 0, durationMs: 0 };
    const q   = usage.queues.status         === "ok" ? usage.queues.data         : { operations: 0 };
    const costs = estimateCosts({ workers: w, workersAI: ai, kv, d1, r2, durableObjects: doU, queues: q });
    const projected = projectMonthEnd(costs);

    return json({
      usage,
      costs,
      projected,
      billingPeriod: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
        end: new Date().toISOString().split("T")[0],
        dayOfMonth: new Date().getDate(),
        daysInMonth: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).getDate(),
      },
      fetchedAt: new Date().toISOString(),
      disclaimer:
        "Estimates only. GraphQL analytics ≠ your invoice. Verify at dash.cloudflare.com → Billing.",
    });
  } catch (e: any) {
    return err(`Failed to fetch usage: ${e.message}`, 502);
  }
}