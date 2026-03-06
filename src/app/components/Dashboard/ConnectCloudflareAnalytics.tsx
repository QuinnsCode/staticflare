"use client";

/**
 * ConnectCloudflareAnalytics — CLIENT component
 * 3-step onboarding flow:
 *   Step 1 — do you have a read-only token?
 *   Step 1b — if not, show how to create one
 *   Step 2 — paste token (account ID auto-detected)
 *   Step 3 — connecting → success → redirect
 */

import { useState } from "react";

const CSS = `
  .cf-connect {
    width: 100%;
    max-width: 480px;
    font-family: 'Barlow', sans-serif;
  }

  .cf-steps {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 32px;
  }
  .cf-step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3a4e3a;
    transition: color 0.2s;
  }
  .cf-step.active { color: #f48c06; }
  .cf-step.done { color: #22c55e; }
  .cf-step-num {
    width: 22px; height: 22px;
    border-radius: 2px;
    border: 1px solid #3a4e3a;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; flex-shrink: 0;
    transition: all 0.2s;
  }
  .cf-step.active .cf-step-num {
    border-color: #f48c06;
    background: rgba(232,93,4,0.1);
    color: #f48c06;
  }
  .cf-step.done .cf-step-num {
    border-color: #22c55e;
    background: rgba(34,197,94,0.1);
    color: #22c55e;
  }
  .cf-step-line {
    flex: 1; height: 1px;
    background: #1a2e1a;
    margin: 0 8px;
  }

  .cf-card {
    background: #0a0f0a;
    border: 1px solid rgba(232,93,4,0.2);
    border-radius: 4px;
    overflow: hidden;
  }
  .cf-card-top {
    height: 2px;
    background: linear-gradient(90deg, #dc2626, #e85d04, #f48c06);
  }
  .cf-card-body { padding: 28px; }

  .cf-card-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px; font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #e8f0e8; margin-bottom: 8px;
  }
  .cf-card-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a;
    letter-spacing: 0.08em; margin-bottom: 24px;
  }

  .cf-yesno {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 8px;
  }
  .cf-yesno-btn {
    padding: 16px;
    border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.06);
    background: #0f160f;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #8a9e8a; cursor: pointer;
    transition: all 0.15s;
    display: flex; flex-direction: column;
    align-items: center; gap: 8px;
  }
  .cf-yesno-btn:hover { border-color: rgba(232,93,4,0.3); color: #e8f0e8; }
  .cf-yesno-btn.yes:hover { border-color: #22c55e; color: #22c55e; background: rgba(34,197,94,0.05); }
  .cf-yesno-btn.no:hover  { border-color: #f48c06; color: #f48c06; background: rgba(232,93,4,0.05); }
  .cf-yesno-icon { font-size: 24px; }

  .cf-option-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #8a9e8a;
    display: flex; align-items: center; gap: 8px;
  }
  .cf-option-note {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a;
    line-height: 1.6; letter-spacing: 0.03em;
    padding: 10px 14px;
    background: rgba(34,197,94,0.04);
    border: 1px solid rgba(34,197,94,0.1);
    border-radius: 3px;
  }
  .cf-divider {
    height: 1px; background: rgba(255,255,255,0.04);
    margin: 4px 0;
  }

  .cf-deeplink-btn {
    display: block; width: 100%; padding: 14px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    border-radius: 3px; text-decoration: none;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; text-align: center;
    box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s;
  }
  .cf-deeplink-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }

  .cf-perm-grid {
    display: flex; flex-direction: column; gap: 4px;
    background: #060a06;
    border: 1px solid rgba(232,93,4,0.1);
    border-radius: 3px; padding: 12px 14px;
  }
  .cf-perm-row {
    display: flex; gap: 12px; align-items: baseline;
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
  }
  .cf-perm-name { color: #f48c06; flex-shrink: 0; min-width: 160px; }
  .cf-perm-desc { color: #3a4e3a; }

  .cf-howto { display: flex; flex-direction: column; gap: 16px; }
  .cf-howto-done {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    border: none; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer;
    box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s; margin-top: 8px;
  }
  .cf-howto-done:hover { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }

  .cf-fields { display: flex; flex-direction: column; gap: 18px; }
  .cf-field { display: flex; flex-direction: column; gap: 6px; }
  .cf-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #8a9e8a;
    display: flex; justify-content: space-between; align-items: center;
  }
  .cf-label a {
    font-size: 11px; color: #f48c06;
    text-decoration: none; font-weight: 400;
    letter-spacing: 0.08em; text-transform: none;
  }
  .cf-label a:hover { text-decoration: underline; }
  .cf-input {
    background: #060a06;
    border: 1px solid rgba(232,93,4,0.2);
    border-radius: 3px; padding: 11px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px; color: #e8f0e8;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
  }
  .cf-input::placeholder { color: #3a4e3a; }
  .cf-input:focus { border-color: #e85d04; box-shadow: 0 0 0 3px rgba(232,93,4,0.1); }
  .cf-input:disabled { opacity: 0.4; cursor: not-allowed; }
  .cf-hint {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a; letter-spacing: 0.04em;
  }

  .cf-error {
    display: flex; gap: 8px; align-items: flex-start;
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.2);
    border-radius: 3px; padding: 10px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px; color: #ef4444;
    letter-spacing: 0.04em;
  }

  .cf-submit {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    border: none; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer;
    box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s; margin-top: 4px;
  }
  .cf-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }
  .cf-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .cf-security {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a;
    line-height: 1.6; letter-spacing: 0.03em;
    margin-top: 4px;
  }

  .cf-connecting {
    display: flex; flex-direction: column;
    align-items: center; gap: 20px;
    padding: 16px 0; text-align: center;
  }
  .cf-connecting-icon {
    font-size: 40px;
    animation: cf-pulse 1.5s ease-in-out infinite;
  }
  @keyframes cf-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
  .cf-connecting-title {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 18px; letter-spacing: 0.1em;
    text-transform: uppercase; color: #e8f0e8;
  }
  .cf-connecting-log {
    display: flex; flex-direction: column; gap: 6px;
    width: 100%; text-align: left;
    background: #060a06;
    border: 1px solid rgba(232,93,4,0.12);
    border-radius: 3px; padding: 14px 16px;
  }
  .cf-log-line {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; letter-spacing: 0.06em;
    display: flex; gap: 10px;
  }
  .cf-log-prompt { color: #e85d04; }
  .cf-log-ok { color: #22c55e; }
  .cf-log-pending { color: #3a4e3a; }
  .cf-log-active { color: #f48c06; }
  .cf-cursor {
    display: inline-block; width: 7px; height: 12px;
    background: #f48c06; margin-left: 2px;
    animation: cf-blink 1s step-end infinite;
    vertical-align: text-bottom;
  }
  @keyframes cf-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .cf-back {
    background: none; border: none; cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a;
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-top: 16px; padding: 0;
    transition: color 0.15s;
  }
  .cf-back:hover { color: #8a9e8a; }
`;

type Step = "ask" | "howto" | "form" | "connecting";

export function ConnectCloudflareAnalytics() {
  const [step, setStep] = useState<Step>("ask");
  const [accountId, setAccountId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [logLines, setLogLines] = useState<{ text: string; status: "ok" | "active" | "pending" }[]>([]);

  // Auto-detect account ID when token is pasted
  async function handleTokenChange(val: string) {
    setToken(val);
    if (val.trim().length < 20) return;
    try {
      const res = await fetch("https://api.cloudflare.com/client/v4/accounts?per_page=1", {
        headers: { Authorization: `Bearer ${val.trim()}` },
      });
      const data = await res.json();
      const id = data?.result?.[0]?.id;
      if (id) setAccountId(id);
    } catch {}
  }

  async function handleConnect() {
    if (!token.trim() || !accountId.trim()) {
      setError("Both fields are required.");
      return;
    }

    setError("");
    setStep("connecting");
    setLogLines([
      { text: "detecting account...", status: "active" },
      { text: "checking token permissions...", status: "pending" },
      { text: "verifying read-only access...", status: "pending" },
      { text: "encrypting session cookie...", status: "pending" },
    ]);

    setTimeout(() => setLogLines(l => l.map((line, i) => i === 0 ? { ...line, status: "ok" } : i === 1 ? { ...line, status: "active" } : line)), 600);
    setTimeout(() => setLogLines(l => l.map((line, i) => i === 1 ? { ...line, status: "ok" } : i === 2 ? { ...line, status: "active" } : line)), 1200);
    setTimeout(() => setLogLines(l => l.map((line, i) => i === 2 ? { ...line, status: "ok" } : i === 3 ? { ...line, status: "active" } : line)), 1800);

    try {
      const res = await fetch("/api/cf/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), accountId: accountId.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStep("form");
        setError(data.error ?? "Connection failed.");
        return;
      }

      setLogLines(l => l.map(line => ({ ...line, status: "ok" })));
      setToken("");
      setTimeout(() => { window.location.href = "/dashboard"; }, 500);

    } catch {
      setStep("form");
      setError("Network error. Please try again.");
    }
  }

  const stepNum = step === "ask" || step === "howto" ? 1 : step === "form" ? 2 : 3;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cf-connect">

        {/* Step indicator */}
        <div className="cf-steps">
          <div className={`cf-step ${stepNum > 1 ? "done" : stepNum === 1 ? "active" : ""}`}>
            <span className="cf-step-num">{stepNum > 1 ? "✓" : "1"}</span>
            <span>Token</span>
          </div>
          <div className="cf-step-line" />
          <div className={`cf-step ${stepNum > 2 ? "done" : stepNum === 2 ? "active" : ""}`}>
            <span className="cf-step-num">{stepNum > 2 ? "✓" : "2"}</span>
            <span>Connect</span>
          </div>
          <div className="cf-step-line" />
          <div className={`cf-step ${stepNum === 3 ? "active" : ""}`}>
            <span className="cf-step-num">3</span>
            <span>Done</span>
          </div>
        </div>

        <div className="cf-card">
          <div className="cf-card-top" />
          <div className="cf-card-body">

            {/* ── Step 1: ask ── */}
            {step === "ask" && (
              <>
                <div className="cf-card-title">Read-only API token</div>
                <div className="cf-card-sub">// required to fetch your usage data</div>
                <p style={{ fontSize: 14, color: "#8a9e8a", lineHeight: 1.7, marginBottom: 24 }}>
                  FlareUp needs a Cloudflare API token to read your usage.
                  It must be <strong style={{ color: "#e8f0e8" }}>Account Analytics: Read</strong> only —
                  write permissions are rejected on connect.
                </p>
                <div className="cf-yesno">
                  <button className="cf-yesno-btn yes" onClick={() => setStep("form")}>
                    <span className="cf-yesno-icon">✓</span>
                    I have a token
                  </button>
                  <button className="cf-yesno-btn no" onClick={() => setStep("howto")}>
                    <span className="cf-yesno-icon">?</span>
                    Show me how
                  </button>
                </div>
              </>
            )}

            {/* ── Step 1b: howto ── */}
            {step === "howto" && (
              <>
                <div className="cf-card-title">Create your token</div>
                <div className="cf-card-sub">// read-only, you control what's included</div>
                <div className="cf-howto">
                  <p style={{ fontSize: 13, color: "#8a9e8a", lineHeight: 1.7, margin: 0 }}>
                    Click below to open Cloudflare with our recommended permissions pre-filled.
                    You can <strong style={{ color: "#e8f0e8" }}>add, remove, or change anything</strong>.
                  </p>

                  <a
                    className="cf-deeplink-btn"
                    href={`https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${encodeURIComponent(JSON.stringify([
                      {key:"account_analytics",type:"read"},
                      {key:"billing",type:"read"},
                      {key:"ai",type:"read"},
                      {key:"workers_kv_storage",type:"read"},
                      {key:"workers_r2",type:"read"},
                      {key:"d1",type:"read"},
                      {key:"queues",type:"read"},
                      {key:"stream",type:"read"},
                      {key:"images",type:"read"},
                      {key:"pages",type:"read"},
                      {key:"workers_scripts",type:"read"},
                      {key:"workers_observability",type:"read"},
                      {key:"vectorize",type:"read"},
                      {key:"containers",type:"read"},
                      {key:"hyperdrive",type:"read"},
                      {key:"browser_rendering",type:"read"},
                    ]))}&name=FlareUp`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Cloudflare token creator →
                  </a>

                  <div className="cf-option-note">
                    Name it anything → <strong>Continue to summary</strong> → <strong>Create Token</strong> → copy it here.
                  </div>

                  <div className="cf-divider" />

                  <div className="cf-option-label">What we pre-fill (all read-only)</div>
                  <div className="cf-perm-grid">
                    {[
                      ["Account Analytics", "Workers, KV, D1, R2, DO, Queues via GraphQL"],
                      ["Billing", "Invoice history — 3 months back"],
                      ["Workers AI", "Neuron usage per model"],
                      ["Workers KV Storage", "KV read/write counts"],
                      ["Workers R2 Storage", "R2 ops + egress"],
                      ["D1", "Query counts, rows read/written"],
                      ["Queues", "Message operations"],
                      ["Stream", "Video minutes stored + delivered"],
                      ["Cloudflare Images", "Images stored + transformed"],
                      ["Cloudflare Pages", "Functions invocations"],
                      ["Workers Scripts", "Deployed scripts"],
                      ["Workers Observability", "CPU time, errors"],
                      ["Vectorize", "Queries + dimensions stored"],
                      ["Containers", "Compute time"],
                      ["Hyperdrive", "Connection usage"],
                      ["Browser Rendering", "Session usage"],
                    ].map(([name, desc]) => (
                      <div className="cf-perm-row" key={name}>
                        <span className="cf-perm-name">{name}</span>
                        <span className="cf-perm-desc">{desc}</span>
                      </div>
                    ))}
                  </div>

                  <button className="cf-howto-done" onClick={() => setStep("form")}>
                    I've got my token →
                  </button>
                  <button className="cf-back" onClick={() => setStep("ask")}>← back</button>
                </div>
              </>
            )}

            {/* ── Step 2: form ── */}
            {step === "form" && (
              <>
                <div className="cf-card-title">Connect account</div>
                <div className="cf-card-sub">// paste your token — account auto-detected</div>
                <div className="cf-fields">

                  {/* Token first — triggers auto-detect */}
                  <div className="cf-field">
                    <label className="cf-label" htmlFor="token">
                      API Token
                      <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer">
                        Create token →
                      </a>
                    </label>
                    <input
                      className="cf-input"
                      id="token"
                      type="password"
                      placeholder="Paste your token here..."
                      value={token}
                      onChange={e => handleTokenChange(e.target.value)}
                      autoComplete="off"
                    />
                    <div className="cf-hint">// write permissions are rejected on connect</div>
                  </div>

                  {/* Account ID — auto-filled, user can override */}
                  <div className="cf-field">
                    <label className="cf-label" htmlFor="accountId">
                      Account ID
                      {accountId
                        ? <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>✓ auto-detected</span>
                        : <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">Find it →</a>
                      }
                    </label>
                    <input
                      className="cf-input"
                      id="accountId"
                      type="text"
                      placeholder="Auto-filled when token is pasted..."
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <div className="cf-hint">// dash.cloudflare.com → right sidebar under your account name</div>
                  </div>

                  {error && (
                    <div className="cf-error">
                      <span>✕</span> {error}
                    </div>
                  )}

                  <button
                    className="cf-submit"
                    onClick={handleConnect}
                    disabled={!token || !accountId}
                  >
                    Connect account
                  </button>

                  <div className="cf-security">
                    // token verified read-only · AES-GCM encrypted
                    · stored in HttpOnly cookie only · never touches a database
                  </div>
                </div>
                <button className="cf-back" onClick={() => setStep("ask")}>← back</button>
              </>
            )}

            {/* ── Step 3: connecting ── */}
            {step === "connecting" && (
              <div className="cf-connecting">
                <div className="cf-connecting-icon">⚡</div>
                <div className="cf-connecting-title">Connecting...</div>
                <div className="cf-connecting-log">
                  {logLines.map((line, i) => (
                    <div className="cf-log-line" key={i}>
                      <span className="cf-log-prompt">›</span>
                      <span className={
                        line.status === "ok" ? "cf-log-ok" :
                        line.status === "active" ? "cf-log-active" :
                        "cf-log-pending"
                      }>
                        {line.status === "ok" && "✓ "}
                        {line.text}
                        {line.status === "active" && <span className="cf-cursor" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}