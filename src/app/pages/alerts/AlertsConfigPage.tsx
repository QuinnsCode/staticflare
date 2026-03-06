/**
 * AlertsConfigPage — SERVER component
 *
 * Server does:
 *   - reads alert config from KV
 *   - renders full page skeleton (headers, descriptions, tier list structure)
 *   - passes initialConfig to client editors as a prop
 *
 * Client components:
 *   - AlertTierEditor  (local state + one POST on save)
 *   - WebhookEditor    (local state + test + one POST on save)
 *
 * No fetching happens in the browser on load.
 */

import { getAlertConfig } from "@/lib/alerts/config";
import { getSessionCookie, decryptSession } from "@/lib/session";
import { env } from "cloudflare:workers";

import { AlertTierEditor } from "@/app/components/Dashboard/AlertTierEditor";
import { WebhookEditor } from "@/app/components/Dashboard/WebhookEditor";

function Breadcrumb() {
  return (
    <nav className="breadcrumb">
      <a href="/dashboard" className="breadcrumb-link">← Dashboard</a>
      <span className="breadcrumb-sep">/</span>
      <span>Alert configuration</span>
    </nav>
  );
}

export default async function AlertsConfigPage({ request }: { request: Request }) {
  // ── 1. Auth (server only) ───────────────────────────────────────────────────
  const cookie = getSessionCookie(request);
  const secret = (env as any).APP_SECRET;

  if (!cookie || !secret) {
    return (
      <div className="page page--centered" style={{ minHeight: "100vh" }}>
        <style>{styles}</style>
        <p style={{ color: "var(--text-muted)" }}>
          Not connected. <a href="/dashboard" style={{ color: "var(--accent)" }}>Go back →</a>
        </p>
      </div>
    );
  }

  const session = await decryptSession(cookie, secret);
  if (!session || Date.now() > session.expiresAt) {
    return (
      <div className="page page--centered" style={{ minHeight: "100vh" }}>
        <style>{styles}</style>
        <p style={{ color: "var(--text-muted)" }}>
          Session expired. <a href="/dashboard" style={{ color: "var(--accent)" }}>Reconnect →</a>
        </p>
      </div>
    );
  }

  // ── 2. Read config from KV (server only) ───────────────────────────────────
  const config = await getAlertConfig((env as any).ALERT_CONFIG_KV);

  // ── 3. Render full skeleton — server HTML ───────────────────────────────────
  return (
    <div className="page">
      <style>{styles}</style>

      {/* Header */}
      <div className="alerts-header">
        <Breadcrumb />
        <div className="alerts-header-content">
          <h1 className="alerts-title">Alert configuration</h1>
          <p className="alerts-sub">
            Set budget thresholds and webhook destinations.
            Alerts fire from the background cron — no browser tab needed.
          </p>
        </div>
      </div>

      {/* Tiers section */}
      <div className="config-section">
        <div className="config-section-header">
          <div>
            <h2 className="config-section-title">Budget tiers</h2>
            <p className="config-section-desc">
              Each tier fires when your projected month-end spend crosses its % threshold.
              Tiers can repeat on an interval if the condition persists.
            </p>
          </div>
        </div>

        {/* Tier summary (server HTML, static) */}
        <div className="tier-summary">
          {[...config.tiers]
            .sort((a, b) => a.budgetPercent - b.budgetPercent)
            .map((t) => (
              <div key={t.id} className={`tier-chip ${!t.enabled ? "tier-chip--off" : ""}`}>
                <span className="tier-chip-pct">
                  {Math.round(t.budgetPercent * 100)}%
                </span>
                <span className="tier-chip-name">{t.name}</span>
              </div>
            ))}
        </div>

        {/* CLIENT: editing interactions */}
        <AlertTierEditor initialConfig={config} />
      </div>

      {/* Webhooks section */}
      <div className="config-section">
        <div className="config-section-header">
          <div>
            <h2 className="config-section-title">Webhooks</h2>
            <p className="config-section-desc">
              POST JSON to any URL. Works with Slack incoming webhooks, Discord,
              PagerDuty, or any custom endpoint.
            </p>
          </div>
        </div>

        {/* Webhook count summary (server HTML, static) */}
        {config.webhooks.length > 0 && (
          <div className="webhook-summary">
            {config.webhooks.map((w) => (
              <div key={w.id} className={`webhook-chip ${!w.enabled ? "webhook-chip--off" : ""}`}>
                <span className="webhook-chip-dot">◆</span>
                <span>{w.name || w.url}</span>
              </div>
            ))}
          </div>
        )}

        {/* CLIENT: editing interactions */}
        <WebhookEditor initialConfig={config} />
      </div>

      {/* Docs callout (pure server HTML) */}
      <div className="docs-callout">
        <h3>How cron alerts work</h3>
        <p>
          Deploy FlareUp as a Worker with the secrets <code>CF_API_TOKEN</code> and{" "}
          <code>CF_ACCOUNT_ID</code> set. The cron runs every 5 minutes for spike
          detection, hourly for burn rate, and daily for a full report.
        </p>
        <pre className="docs-code">
{`wrangler secret put CF_API_TOKEN
wrangler secret put CF_ACCOUNT_ID
wrangler deploy`}
        </pre>
        <a
          href="https://github.com/your-org/flareup"
          className="docs-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Setup guide →
        </a>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    --green: #22c55e;
    --accent: #f97316;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --font-body: 'IBM Plex Sans', 'DM Sans', system-ui, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    padding-bottom: 64px;
  }

  .page--centered {
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Header ── */
  .alerts-header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
  .breadcrumb-link { color: var(--text-muted); text-decoration: none; }
  .breadcrumb-link:hover { color: var(--accent); }
  .breadcrumb-sep { color: var(--text-dim); }
  .alerts-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
  .alerts-sub { font-size: 14px; color: var(--text-muted); line-height: 1.5; }

  /* ── Config sections ── */
  .config-section {
    margin: 32px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .config-section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    border-bottom: 1px solid var(--border);
  }
  .config-section-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
  .config-section-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; max-width: 520px; }

  /* ── Tier summary chips (server HTML) ── */
  .tier-summary {
    display: flex;
    gap: 8px;
    padding: 16px 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .tier-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 12px;
    background: var(--surface2);
  }
  .tier-chip--off { opacity: 0.35; }
  .tier-chip-pct { font-family: var(--font-mono); font-weight: 700; color: var(--accent); }
  .tier-chip-name { color: var(--text-muted); }

  /* ── Webhook summary chips (server HTML) ── */
  .webhook-summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .webhook-chip { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
  .webhook-chip--off { opacity: 0.35; }
  .webhook-chip-dot { color: var(--accent); font-size: 8px; }

  /* ── Editor sections (client) ── */
  .editor-section { padding: 24px; }

  .field-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .field-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); min-width: 140px; }
  .field-hint { font-size: 12px; color: var(--text-dim); }

  .field-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 13px;
    font-family: var(--font-mono);
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
  }
  .field-input:focus { border-color: var(--accent); }
  .field-input--sm { width: 100px; }
  .field-input--name { flex: 1; min-width: 160px; font-family: var(--font-body); }
  .field-input--pct { width: 72px; }
  .field-input--url { flex: 1; min-width: 240px; font-family: var(--font-mono); font-size: 12px; }
  .field-unit { font-size: 12px; color: var(--text-dim); }
  .field-row--inline { display: flex; align-items: center; gap: 6px; }

  /* ── Tiers list ── */
  .tiers-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .tier-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    flex-wrap: wrap;
  }
  .tier-row--disabled { opacity: 0.4; }
  .tier-row-left { display: flex; align-items: center; gap: 10px; flex: 1; }
  .tier-row-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .tier-toggle { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
  .tier-remove {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 12px;
    padding: 4px;
    transition: color 0.15s;
  }
  .tier-remove:hover { color: var(--red); }

  /* ── Webhooks list ── */
  .webhooks-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  .webhooks-empty { font-size: 13px; color: var(--text-dim); padding: 16px; text-align: center; }
  .webhook-row {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .webhook-row--disabled { opacity: 0.4; }
  .webhook-row-top { display: flex; align-items: center; gap: 10px; }
  .webhook-row-url { display: flex; align-items: center; gap: 10px; padding-left: 26px; }

  .test-btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-muted);
    white-space: nowrap;
    transition: all 0.15s;
  }
  .test-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .test-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .test-btn--ok { border-color: var(--green) !important; color: var(--green) !important; }
  .test-btn--fail { border-color: var(--red) !important; color: var(--red) !important; }

  /* ── Editor actions bar ── */
  .editor-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .save-error { font-size: 13px; color: var(--red); }
  .save-ok { font-size: 13px; color: var(--green); }

  /* ── Buttons ── */
  .action-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-family: var(--font-body);
    transition: all 0.15s;
  }
  .action-btn:hover { border-color: var(--accent); color: var(--accent); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn--primary { border-color: var(--accent); color: var(--accent); }
  .action-btn--ghost { color: var(--text-muted); }

  /* ── Docs callout ── */
  .docs-callout {
    margin: 0 32px;
    padding: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .docs-callout h3 { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
  .docs-callout p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px; }
  .docs-callout code {
    font-family: var(--font-mono);
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    color: var(--accent);
  }
  .docs-code {
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px 16px;
    color: var(--text-muted);
    margin-bottom: 14px;
    white-space: pre;
    overflow-x: auto;
  }
  .docs-link { font-size: 13px; color: var(--accent); text-decoration: none; }
  .docs-link:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .config-section { margin: 16px; }
    .alerts-header { padding: 16px; }
    .editor-section { padding: 16px; }
    .tier-row { flex-direction: column; align-items: flex-start; }
    .tier-row-right { flex-wrap: wrap; }
  }
`;