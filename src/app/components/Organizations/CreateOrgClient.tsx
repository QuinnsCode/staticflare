"use client";

import { useState } from "react";
import BetterAuthLogin from "@/app/pages/user/BetterAuthLogin";
import { createOrganization } from "@/app/serverActions/orgs/createOrg";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Barlow:wght@300;400;500&family=Barlow+Condensed:wght@600;700&display=swap');

  :root {
    --orange:   #e85d04;
    --orange-l: #f48c06;
    --orange-g: rgba(232,93,4,0.18);
    --red:      #dc2626;
    --red-l:    #ef4444;
    --green-l:  #22c55e;
    --bg:       #060a06;
    --bg-2:     #0a0f0a;
    --bg-3:     #0f160f;
    --border:   rgba(255,255,255,0.05);
    --border-o: rgba(232,93,4,0.2);
    --border-r: rgba(220,38,38,0.2);
    --text:     #e8f0e8;
    --text-2:   #8a9e8a;
    --text-3:   #3a4e3a;
    --display:  'Barlow Condensed', sans-serif;
    --condensed:'Barlow Condensed', sans-serif;
    --mono:     'Share Tech Mono', monospace;
  }

  .co-page {
    min-height: 100vh;
    background: var(--bg);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 20px;
    position: relative; overflow: hidden;
    font-family: 'Barlow', sans-serif;
    color: var(--text);
  }

  /* Grid background */
  .co-page::before {
    content: ''; position: fixed; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(232,93,4,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232,93,4,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%);
  }

  /* Scanlines */
  .co-page::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px
    );
  }

  .co-card {
    width: 100%; max-width: 520px;
    background: var(--bg-2);
    border: 1px solid var(--border-o);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,93,4,0.06);
    position: relative; z-index: 1;
  }

  .co-card-top {
    height: 3px;
    background: linear-gradient(90deg, var(--red), var(--orange), var(--orange-l));
  }

  .co-header {
    padding: 28px 32px 24px;
    border-bottom: 1px solid var(--border-o);
    background: rgba(232,93,4,0.03);
  }

  .co-wordmark {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--display);
    font-size: 16px; letter-spacing: 0.12em;
    color: var(--orange-l); margin-bottom: 20px;
    text-shadow: 0 0 20px var(--orange-g);
  }
  .co-wordmark-flame { color: var(--red-l); }

  .co-title {
    font-family: var(--display);
    font-size: 28px; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--text);
    margin-bottom: 6px;
  }
  .co-subtitle {
    font-family: var(--mono);
    font-size: 11px; letter-spacing: 0.1em;
    color: var(--text-3); text-transform: uppercase;
  }
  .co-subtitle span { color: var(--orange-l); }

  .co-body { padding: 28px 32px 32px; }

  /* Auth wrapper */
  .co-auth-wrap {
    background: var(--bg-3);
    border: 1px solid var(--border-o);
    border-radius: 3px; padding: 24px;
    margin-bottom: 24px;
  }
  .co-auth-label {
    font-family: var(--mono); font-size: 10px;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .co-auth-label::before {
    content: ''; display: block;
    width: 16px; height: 1px; background: var(--text-3);
  }

  /* Form fields */
  .co-field { margin-bottom: 20px; }
  .co-label {
    display: block;
    font-family: var(--condensed);
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--text-2); margin-bottom: 8px;
  }
  .co-input {
    width: 100%;
    background: var(--bg-3);
    border: 1px solid var(--border-o);
    border-radius: 3px;
    padding: 11px 14px;
    font-family: var(--mono); font-size: 13px;
    color: var(--text); outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .co-input::placeholder { color: var(--text-3); }
  .co-input:focus {
    border-color: var(--orange);
    box-shadow: 0 0 0 3px var(--orange-g);
  }
  .co-input:disabled { opacity: 0.4; cursor: not-allowed; }

  .co-input-row {
    display: flex; align-items: stretch;
    border: 1px solid var(--border-o); border-radius: 3px; overflow: hidden;
  }
  .co-input-row .co-input {
    border: none; border-radius: 0; flex: 1;
  }
  .co-input-row .co-input:focus { box-shadow: none; }
  .co-input-row:focus-within {
    border-color: var(--orange);
    box-shadow: 0 0 0 3px var(--orange-g);
  }
  .co-input-suffix {
    display: flex; align-items: center;
    padding: 0 14px;
    background: rgba(232,93,4,0.06);
    border-left: 1px solid var(--border-o);
    font-family: var(--mono); font-size: 12px;
    color: var(--text-3); white-space: nowrap;
  }

  .co-hint {
    font-family: var(--mono); font-size: 11px;
    color: var(--text-3); margin-top: 6px;
    letter-spacing: 0.04em;
  }

  /* Submit */
  .co-submit {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--red), var(--orange));
    border: none; border-radius: 3px;
    font-family: var(--display); font-size: 14px;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer;
    box-shadow: 0 2px 24px var(--orange-g);
    transition: all 0.2s; margin-top: 8px;
    position: relative; overflow: hidden;
  }
  .co-submit::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06));
  }
  .co-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 36px rgba(232,93,4,0.4);
  }
  .co-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .co-submit-inner { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .co-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Error / success */
  .co-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(220,38,38,0.08);
    border: 1px solid var(--border-r);
    border-radius: 3px; padding: 12px 16px;
    font-size: 13px; color: var(--red-l);
    margin-bottom: 20px;
    font-family: var(--mono); letter-spacing: 0.04em;
  }
  .co-success {
    display: flex; align-items: center; gap: 10px;
    background: rgba(22,163,74,0.08);
    border: 1px solid rgba(34,197,94,0.2);
    border-radius: 3px; padding: 12px 16px;
    font-size: 13px; color: var(--green-l);
    margin-bottom: 20px;
    font-family: var(--mono); letter-spacing: 0.04em;
  }
  .co-success-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green-l); flex-shrink: 0;
    box-shadow: 0 0 6px var(--green-l);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

  /* Info box */
  .co-info {
    margin-top: 24px; padding: 18px 20px;
    background: var(--bg-3);
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .co-info-title {
    font-family: var(--condensed); font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--text-2); margin-bottom: 12px;
  }
  .co-info-list { display: flex; flex-direction: column; gap: 8px; }
  .co-info-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: var(--text-2); line-height: 1.5;
  }
  .co-info-dot {
    width: 4px; height: 4px; border-radius: 1px;
    background: var(--orange-l); transform: rotate(45deg);
    flex-shrink: 0; margin-top: 6px;
  }

  /* Footer strip */
  .co-footer {
    margin-top: 24px; padding-top: 20px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .co-user {
    font-family: var(--mono); font-size: 11px; color: var(--text-3);
    letter-spacing: 0.06em;
  }
  .co-user span { color: var(--orange-l); }
  .co-signout {
    background: none; border: none; cursor: pointer;
    font-family: var(--condensed); font-size: 11px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3); transition: color 0.15s;
  }
  .co-signout:hover { color: var(--red-l); }
  .co-signout:disabled { opacity: 0.4; cursor: not-allowed; }

  .co-back {
    margin-top: 20px; text-align: center;
    font-family: var(--condensed); font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3);
    position: relative; z-index: 1;
  }
  .co-back a { color: var(--text-3); transition: color 0.15s; }
  .co-back a:hover { color: var(--orange-l); }
`;

interface CreateOrgClientProps {
  initialUser: any;
}

export function CreateOrgClient({ initialUser }: CreateOrgClientProps) {
  const [user, setUser] = useState(initialUser);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = await createOrganization(formData);
      if (result.success) {
        window.location.href = result.redirectUrl!;
      } else {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch {
      setError("Failed to initialize workspace.");
      setIsSubmitting(false);
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="co-page">
          <div className="co-card">
            <div className="co-card-top" />
            <div className="co-header">
              <a href="/" className="co-wordmark">
                <span className="co-wordmark-flame">▲</span> FLAREUP
              </a>
              <div className="co-title">Access required</div>
              <div className="co-subtitle">sign in to initialize workspace</div>
            </div>
            <div className="co-body">
              <div className="co-auth-label">authenticate</div>
              <div className="co-auth-wrap">
                <BetterAuthLogin
                  onAuthSuccess={handleAuthSuccess}
                  redirectOnSuccess={false}
                  showDevTools={false}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="co-back">
            <a href="/">← back to dashboard</a>
          </div>
        </div>
      </>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="co-page">
        <div className="co-card">
          <div className="co-card-top" />

          <div className="co-header">
            <a href="/" className="co-wordmark">
              <span className="co-wordmark-flame">▲</span> FLAREUP
            </a>
            <div className="co-title">New workspace</div>
            <div className="co-subtitle">
              operator: <span>{user.name || user.email}</span>
            </div>
          </div>

          <div className="co-body">
            {showSuccess && (
              <div className="co-success">
                <span className="co-success-dot" />
                authenticated — configure your workspace below
              </div>
            )}

            {error && (
              <div className="co-error">
                <span>✕</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="co-field">
                <label className="co-label" htmlFor="name">
                  Workspace name
                </label>
                <input
                  className="co-input"
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isSubmitting}
                  placeholder="Acme Corp"
                  autoComplete="off"
                />
                <div className="co-hint">// human-readable label for your team</div>
              </div>

              <div className="co-field">
                <label className="co-label" htmlFor="slug">
                  Workspace slug
                </label>
                <div className="co-input-row">
                  <input
                    className="co-input"
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    disabled={isSubmitting}
                    pattern="[a-z0-9\-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    placeholder="acme-corp"
                    autoComplete="off"
                  />
                  <span className="co-input-suffix">.flareup.dev</span>
                </div>
                <div className="co-hint">// lowercase, hyphens only</div>
              </div>

              <button
                className="co-submit"
                type="submit"
                disabled={isSubmitting}
              >
                <span className="co-submit-inner">
                  {isSubmitting ? (
                    <>
                      <span className="co-spinner" />
                      Initializing…
                    </>
                  ) : (
                    "Initialize workspace"
                  )}
                </span>
              </button>
            </form>

            <div className="co-info">
              <div className="co-info-title">What gets created</div>
              <div className="co-info-list">
                {[
                  "You become the owner — full alert config access",
                  "Workspace slug becomes your dashboard subdomain",
                  "Alert tiers and webhooks are scoped to this workspace",
                  "Invite teammates to share cost visibility",
                ].map(item => (
                  <div className="co-info-item" key={item}>
                    <span className="co-info-dot" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="co-footer">
              <div className="co-user">
                operator: <span>{user.name || user.email}</span>
              </div>
              <button
                className="co-signout"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  import("@/lib/auth-client").then(({ authClient }) => {
                    authClient.signOut().then(() => setUser(null));
                  });
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="co-back">
          <a href="/">← back to dashboard</a>
        </div>
      </div>
    </>
  );
}