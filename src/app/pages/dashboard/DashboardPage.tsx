/**
 * DashboardPage — SERVER component
 */

import { getSessionCookie, decryptSession } from "@/lib/session";
import { fetchAllUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd } from "@/lib/cf/pricing";
import { getAlertConfig } from "@/lib/alerts/config";
import { env } from "cloudflare:workers";

import { BurnBar } from "@/app/components/Dashboard/BurnBar";
import { CostGrid } from "@/app/components/Dashboard/CostGrid";
import { ModelTable } from "@/app/components/Dashboard/ModelTable";
import { ConnectCloudflareAnalytics } from "@/app/components/Dashboard/ConnectCloudflareAnalytics";
import { RefreshButton, DisconnectButton } from "@/app/components/Dashboard/DashboardActions";
import { StatusBoard } from "@/app/components/Dashboard/StatusBoard";

function NotConnectedPage() {
  return (
    <div className="page page--centered">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="connect-hero">
        <div className="logo-mark">🔥</div>
        <h1 className="hero-title">FlareUp</h1>
        <p className="hero-sub">
          Cloudflare billing visibility.<br />
          Before the $8,000 surprise.
        </p>
      </div>
      <div className="connect-card">
        <div className="connect-card-header">
          <h2>Connect your Cloudflare account</h2>
          <p>
            Paste a read-only API token. FlareUp rejects anything with
            write access — your infra is safe.
          </p>
        </div>
        <ConnectCloudflareAnalytics />
        <div className="connect-features">
          <div className="connect-feature"><span>◆</span><span>Token verified read-only on connect</span></div>
          <div className="connect-feature"><span>◆</span><span>Encrypted in session cookie — never stored</span></div>
          <div className="connect-feature"><span>◆</span><span>Workers · KV · D1 · R2 · Workers AI · Durable Objects</span></div>
        </div>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="page page--centered">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="error-card">
        <div className="error-icon">⚠</div>
        <h2>Failed to fetch usage</h2>
        <p className="error-message">{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <RefreshButton />
          <DisconnectButton />
        </div>
      </div>
    </div>
  );
}

function DashboardHeader({ accountId, fetchedAt }: { accountId: string; fetchedAt: string }) {
  return (
    <div className="dash-header">
      <div className="dash-header-left">
        <span className="dash-logo">🔥 FlareUp</span>
        <span className="dash-period">
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="dash-header-right">
        <span className="dash-meta">acct {accountId.slice(0, 8)}…</span>
        <span className="dash-meta">{new Date(fetchedAt).toLocaleTimeString()}</span>
        <RefreshButton />
        <DisconnectButton />
        <a href="/alerts" className="action-btn action-btn--primary">Configure alerts</a>
      </div>
    </div>
  );
}

function TierStatusBar({
  projected, budget, tiers,
}: {
  projected: number;
  budget: number;
  tiers: Array<{ name: string; budgetPercent: number; enabled: boolean }>;
}) {
  const activeTier = [...tiers]
    .filter((t) => t.enabled)
    .sort((a, b) => b.budgetPercent - a.budgetPercent)
    .find((t) => projected >= budget * t.budgetPercent);

  if (!activeTier) return null;

  return (
    <div className="tier-status-bar">
      <span className="tier-status-icon">{activeTier.budgetPercent >= 1.0 ? "🚨" : "⚠"}</span>
      <span>
        Alert tier active: <strong>{activeTier.name}</strong> —
        projected spend is {Math.round((projected / budget) * 100)}% of your ${budget} budget.
      </span>
      <a href="/alerts" className="tier-status-link">Review alerts →</a>
    </div>
  );
}

export default async function DashboardPage({ request }: { request: Request }) {
  // ── 1. Session ──────────────────────────────────────────────────────────────
  const cookie = getSessionCookie(request);
  const secret = (env as any).APP_SECRET;
  if (!cookie || !secret) return <NotConnectedPage />;

  const session = await decryptSession(cookie, secret);
  if (!session || Date.now() > session.expiresAt) return <NotConnectedPage />;

  // ── 2. Fetch — fetchAllUsage never throws ───────────────────────────────────
  let usage: Awaited<ReturnType<typeof fetchAllUsage>>;
  let alertConfig: Awaited<ReturnType<typeof getAlertConfig>>;

  try {
    [usage, alertConfig] = await Promise.all([
      fetchAllUsage({ token: session.token, accountId: session.accountId }),
      getAlertConfig((env as any).ALERT_CONFIG_KV),
    ]);
  } catch (e: any) {
    return <ErrorPage message={e.message} />;
  }

  // ── 3. Unwrap ProductResults with zero fallbacks ────────────────────────────
  const w   = usage.workers.status         === "ok" ? usage.workers.data         : { requests: 0, cpuTimeMs: 0 };
  const ai  = usage.workersAI.status       === "ok" ? usage.workersAI.data       : { neurons: 0, requests: 0, byModel: [] };
  const kv  = usage.kv.status              === "ok" ? usage.kv.data              : { reads: 0, writes: 0, deletes: 0, lists: 0 };
  const d1  = usage.d1.status              === "ok" ? usage.d1.data              : { rowsRead: 0, rowsWritten: 0 };
  const r2  = usage.r2.status              === "ok" ? usage.r2.data              : { classAOps: 0, classBOps: 0, storageGB: 0 };
  const doU = usage.durableObjects.status  === "ok" ? usage.durableObjects.data  : { requests: 0, durationMs: 0 };
  const q   = usage.queues.status          === "ok" ? usage.queues.data          : { operations: 0 };

  // ── 4. Cost math ────────────────────────────────────────────────────────────
  const costs = estimateCosts({ workers: w, workersAI: ai, kv, d1, r2, durableObjects: doU, queues: q });
  const projected = projectMonthEnd(costs);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fetchedAt = now.toISOString();

  // ── 5. Collect per-product errors to surface in UI ─────────────────────────
  const productErrors = Object.entries(usage)
    .filter(([, v]) => v.status === "error")
    .map(([k, v]) => `${k}: ${(v as any).error}`) as string[];

  // ── 6. Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <DashboardHeader accountId={session.accountId} fetchedAt={fetchedAt} />

      <TierStatusBar
        projected={projected.total}
        budget={alertConfig.monthlyBudget}
        tiers={alertConfig.tiers}
      />

      {/* Per-product GraphQL errors — visible in UI for debugging */}
      <StatusBoard usage={usage} />


      <BurnBar
        current={costs.total}
        projected={projected.total}
        budget={alertConfig.monthlyBudget}
        dayOfMonth={now.getDate()}
        daysInMonth={daysInMonth}
      />

      <div className="section-header">
        <h2 className="section-title">Cost by service</h2>
        <span className="section-meta">projected month-end</span>
      </div>

      <CostGrid costs={costs} projected={projected} usage={usage} />

      <ModelTable models={ai.byModel} />

      <p className="disclaimer">
        Estimates only. GraphQL analytics ≠ your Cloudflare invoice. Verify at{" "}
        <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
          dash.cloudflare.com → Billing
        </a>.
      </p>
      {/* DEBUG PANEL */}
      <details style={{ margin: "32px 32px 0", background: "#0a0a0a", border: "1px solid #333", borderRadius: 4, padding: 16 }}>
        <summary style={{ fontSize: 11, color: "#666", fontFamily: "monospace", cursor: "pointer" }}>DEBUG</summary>
        <pre style={{ fontSize: 11, color: "#888", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: 8 }}>
            {JSON.stringify({
            tokenTail: session.token.slice(-8),
            accountId: session.accountId,
            expiresAt: new Date(session.expiresAt).toISOString(),
            usage: Object.fromEntries(
                Object.entries(usage).map(([k, v]) => [k, v.status === "error" ? `ERROR: ${(v as any).error}` : "ok"])
            ),
            }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

const styles = `
  :root {
    --bg: #0a0a0a;
    --surface: #111111;
    --surface2: #1a1a1a;
    --border: #2a2a2a;
    --text: #e8e8e8;
    --text-muted: #666;
    --text-dim: #444;
    --red: #ef4444;
    --amber: #f97316;
    --yellow: #eab308;
    --green: #22c55e;
    --accent: #f97316;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    --font-body: 'IBM Plex Sans', 'DM Sans', system-ui, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    padding: 0 0 64px;
  }

  .page--centered {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .dash-header-left { display: flex; align-items: center; gap: 16px; }
  .dash-header-right { display: flex; align-items: center; gap: 12px; }
  .dash-logo { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
  .dash-period { font-size: 13px; color: var(--text-muted); font-family: var(--font-mono); }
  .dash-meta { font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }

  .action-btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 13px;
    font-family: var(--font-body);
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    transition: all 0.15s;
    text-decoration: none;
  }
  .action-btn:hover { border-color: var(--accent); color: var(--accent); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn--primary { border-color: var(--accent); color: var(--accent); }
  .action-btn--ghost { color: var(--text-muted); }

  /* ── Product errors banner ── */
  .product-errors {
    margin: 16px 32px 0;
    background: #0f0800;
    border: 1px solid #3d2000;
    border-radius: 4px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .product-errors-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--amber);
    margin-bottom: 4px;
  }
  .product-error-row {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-muted);
  }

  .tier-status-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 32px;
    background: #1a0f00;
    border-bottom: 1px solid #3d1f00;
    font-size: 14px;
    color: var(--amber);
  }
  .tier-status-link { margin-left: auto; color: var(--amber); font-size: 13px; text-decoration: none; }
  .tier-status-link:hover { text-decoration: underline; }

  .burn-bar-wrap { padding: 24px 32px; border-bottom: 1px solid var(--border); }
  .burn-bar-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
  .burn-bar-left { display: flex; align-items: baseline; gap: 16px; }
  .burn-bar-right { display: flex; align-items: baseline; gap: 16px; }
  .burn-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; font-family: var(--font-mono); }
  .burn-projection { font-size: 28px; font-weight: 700; font-family: var(--font-mono); letter-spacing: -1px; }
  .burn-budget { font-size: 14px; color: var(--text-muted); }
  .burn-days { font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }
  .burn-track { height: 8px; background: var(--surface2); border-radius: 2px; position: relative; overflow: hidden; border: 1px solid var(--border); }
  .burn-fill-projected, .burn-fill-current { position: absolute; top: 0; left: 0; height: 100%; border-radius: 2px; transition: width 0.3s ease; }
  .burn-fill-current { z-index: 2; }
  .burn-budget-line { position: absolute; right: 0; top: 0; width: 2px; height: 100%; background: var(--border); z-index: 3; }
  .burn-legend { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; font-family: var(--font-mono); }

  .section-header { display: flex; align-items: baseline; gap: 12px; padding: 24px 32px 12px; }
  .section-title { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); }
  .section-meta { font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }

  .cost-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1px;
    background: var(--border);
    margin: 0 32px;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .cost-card { background: var(--surface); padding: 20px; display: flex; flex-direction: column; gap: 4px; transition: background 0.15s; }
  .cost-card:hover { background: var(--surface2); }
  .cost-card--top { background: #120d00; }
  .cost-card--top:hover { background: #1a1200; }
  .cost-card--base { opacity: 0.6; }
  .cost-card--error { opacity: 0.5; }
  .cost-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .cost-card-icon { font-size: 16px; }
  .cost-card-label { font-size: 12px; color: var(--text-muted); flex: 1; }
  .cost-card-badge { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: var(--amber); border: 1px solid var(--amber); padding: 1px 4px; border-radius: 2px; }
  .cost-card-badge--error { color: var(--red); border-color: var(--red); }
  .cost-card-projected { font-size: 22px; font-weight: 700; font-family: var(--font-mono); letter-spacing: -0.5px; color: var(--text); }
  .cost-card--top .cost-card-projected { color: var(--amber); }
  .cost-card-mtd { font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); }
  .cost-card-detail { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); margin-top: 4px; }
  .cost-card-error-msg { font-size: 13px; color: var(--text-dim); font-family: var(--font-mono); margin-top: 4px; }

  .model-table-wrap { margin: 0 32px; margin-top: 32px; }
  .model-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .model-table th { padding: 10px 14px; background: var(--surface); color: var(--text-muted); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; border-bottom: 1px solid var(--border); }
  .model-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--text); background: var(--surface); }
  .model-table tr:last-child td { border-bottom: none; }
  .model-table tr:hover td { background: var(--surface2); }
  .model-row--top td { background: #120d00; }
  .model-row--top:hover td { background: #1a1200; }
  .model-id { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
  .model-top-marker { color: var(--amber); }
  .model-cost { font-family: var(--font-mono); font-weight: 600; }
  .text-right { text-align: right; }
  .share-bar-wrap { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .share-bar { height: 4px; background: var(--amber); border-radius: 2px; min-width: 2px; max-width: 60px; opacity: 0.6; }
  .table-disclaimer { font-size: 11px; color: var(--text-dim); margin-top: 8px; }

  .connect-hero { text-align: center; margin-bottom: 40px; }
  .logo-mark { font-size: 48px; margin-bottom: 16px; }
  .hero-title { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 12px; }
  .hero-sub { font-size: 16px; color: var(--text-muted); line-height: 1.6; }
  .connect-card { width: 100%; max-width: 480px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 32px; }
  .connect-card-header { margin-bottom: 24px; }
  .connect-card-header h2 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .connect-card-header p { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
  .connect-form { display: flex; flex-direction: column; gap: 16px; }
  .connect-field { display: flex; flex-direction: column; gap: 6px; }
  .connect-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; }
  .connect-create-link { font-size: 12px; color: var(--accent); text-decoration: none; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .connect-input { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 10px 14px; font-size: 14px; font-family: var(--font-mono); color: var(--text); outline: none; transition: border-color 0.15s; }
  .connect-input:focus { border-color: var(--accent); }
  .connect-input:disabled { opacity: 0.5; }
  .connect-hint { font-size: 12px; color: var(--text-dim); }
  .connect-error { display: flex; gap: 8px; align-items: flex-start; background: #1a0000; border: 1px solid #3d0000; border-radius: 4px; padding: 10px 14px; font-size: 13px; color: var(--red); }
  .connect-error-icon { font-size: 11px; margin-top: 1px; }
  .connect-btn { padding: 12px; background: var(--accent); border: none; border-radius: 4px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; margin-top: 4px; }
  .connect-btn:hover { opacity: 0.9; }
  .connect-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .connect-security-note { font-size: 12px; color: var(--text-dim); line-height: 1.5; }
  .connect-features { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
  .connect-feature { display: flex; gap: 10px; font-size: 13px; color: var(--text-muted); }
  .connect-feature span:first-child { color: var(--accent); }

  .error-card { max-width: 480px; text-align: center; background: var(--surface); border: 1px solid #3d0000; border-radius: 8px; padding: 40px; }
  .error-icon { font-size: 32px; color: var(--amber); margin-bottom: 16px; }
  .error-card h2 { font-size: 20px; margin-bottom: 12px; }
  .error-message { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; font-family: var(--font-mono); }

  .disclaimer { font-size: 12px; color: var(--text-dim); text-align: center; margin-top: 40px; padding: 0 32px; }
  .disclaimer a { color: var(--text-dim); }

  @media (max-width: 640px) {
    .dash-header { padding: 12px 16px; flex-direction: column; gap: 12px; align-items: flex-start; }
    .burn-bar-wrap { padding: 16px; }
    .cost-grid { margin: 0 16px; }
    .model-table-wrap { margin: 0 16px; margin-top: 24px; }
    .section-header { padding: 16px 16px 8px; }
    .product-errors { margin: 16px 16px 0; }
  }
`;