"use client";

import { useState, useMemo } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Barlow+Condensed:wght@600;700&display=swap');

  .os-form { display: flex; flex-direction: column; gap: 20px; }

  .os-label {
    display: block;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #8a9e8a; margin-bottom: 8px;
  }

  .os-input-row {
    display: flex; align-items: stretch;
    border: 1px solid rgba(232,93,4,0.22);
    border-radius: 3px; overflow: hidden;
    transition: box-shadow 0.15s, border-color 0.15s;
  }
  .os-input-row:focus-within {
    border-color: #e85d04;
    box-shadow: 0 0 0 3px rgba(232,93,4,0.15);
  }
  .os-input {
    flex: 1; padding: 12px 14px;
    background: #0a0f0a;
    border: none; outline: none;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px; color: #e8f0e8;
    letter-spacing: 0.04em;
  }
  .os-input::placeholder { color: #3a4e3a; }
  .os-input-suffix {
    display: flex; align-items: center;
    padding: 0 14px;
    background: rgba(232,93,4,0.06);
    border-left: 1px solid rgba(232,93,4,0.15);
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px; color: #3a4e3a;
    white-space: nowrap;
  }

  .os-error {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px; color: #ef4444;
    letter-spacing: 0.04em;
    margin-top: 6px;
  }
  .os-hint {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; color: #3a4e3a;
    letter-spacing: 0.04em; margin-top: 6px;
  }

  .os-submit {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    border: none; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer;
    box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .os-submit::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05));
  }
  .os-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }

  .os-divider {
    display: flex; align-items: center; gap: 12px;
  }
  .os-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
  .os-divider-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #3a4e3a; white-space: nowrap;
  }

  .os-quick-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .os-quick-btn {
    padding: 10px 12px;
    background: #0a0f0a;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 3px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px; letter-spacing: 0.08em;
    color: #3a4e3a; cursor: pointer;
    transition: all 0.15s; text-align: left;
  }
  .os-quick-btn:hover {
    border-color: rgba(232,93,4,0.22);
    color: #f48c06;
    background: rgba(232,93,4,0.04);
  }
  .os-quick-btn span { color: #e85d04; margin-right: 6px; }
`;

export function OrganizationSelector() {
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState("");

  const { baseDomain, displayDomain, isLocalhost } = useMemo(() => {
    if (typeof window === "undefined") {
      return { baseDomain: "", displayDomain: "", isLocalhost: false };
    }
    const { hostname, port } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    let baseDomain: string;
    if (isLocalhost) {
      baseDomain = `${hostname}${port ? `:${port}` : ""}`;
    } else if (hostname.includes(".workers.dev")) {
      const parts = hostname.split(".");
      baseDomain = parts.length > 3 ? parts.slice(-3).join(".") : hostname;
    } else {
      const parts = hostname.split(".");
      baseDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
    }

    return { baseDomain, displayDomain: `.${baseDomain}`, isLocalhost };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgSlug.trim()) {
      setError("workspace slug required");
      return;
    }
    const cleanSlug = orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (!cleanSlug) {
      setError("lowercase letters, numbers, and hyphens only");
      return;
    }
    setError("");
    window.location.href = `${window.location.protocol}//${cleanSlug}.${baseDomain}`;
  };

  const quickTargets = isLocalhost
    ? [
        { label: "test", slug: "test" },
        { label: "demo", slug: "demo" },
        { label: "staging", slug: "staging" },
        { label: "dashboard", slug: "dashboard" },
      ]
    : [
        { label: "test", slug: "test" },
        { label: "demo", slug: "demo" },
        { label: "sandbox", slug: "sandbox" },
        { label: "dashboard", slug: "dashboard" },
      ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form className="os-form" onSubmit={handleSubmit}>

        <div>
          <label className="os-label" htmlFor="orgSlug">
            Workspace slug
          </label>
          <div className="os-input-row">
            <input
              className="os-input"
              id="orgSlug"
              type="text"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="your-workspace"
              autoComplete="off"
              spellCheck={false}
              required
            />
            <span className="os-input-suffix">{displayDomain}</span>
          </div>
          {error && (
            <div className="os-error">
              <span>✕</span> {error}
            </div>
          )}
          <div className="os-hint">// enter slug to navigate to workspace</div>
        </div>

        <button className="os-submit" type="submit">
          Access workspace →
        </button>

        <div className="os-divider">
          <div className="os-divider-line" />
          <span className="os-divider-label">
            {isLocalhost ? "local targets" : "quick access"}
          </span>
          <div className="os-divider-line" />
        </div>

        <div className="os-quick-grid">
          {quickTargets.map(({ label, slug }) => (
            <button
              key={slug}
              type="button"
              className="os-quick-btn"
              onClick={() => setOrgSlug(slug)}
            >
              <span>›</span>{label}
            </button>
          ))}
        </div>

      </form>
    </>
  );
}