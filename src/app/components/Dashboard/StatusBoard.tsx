"use client";

/**
 * StatusBoard — Industrial LED status panel
 * Shows per-product health with animated indicators.
 * Stays visible when connected; collapses to slim bar on success.
 */

import { useState, useEffect } from "react";

type ProductStatus = "ok" | "error" | "pending";

type ProductEntry = {
  key: string;
  label: string;
  status: ProductStatus;
};

type Props = {
  usage: Record<string, { status: "ok" | "error"; error?: string }>;
};

const PRODUCTS = [
  { key: "workers",        label: "Workers" },
  { key: "workersAI",      label: "AI" },
  { key: "kv",             label: "KV" },
  { key: "d1",             label: "D1" },
  { key: "r2",             label: "R2" },
  { key: "durableObjects", label: "DO" },
  { key: "queues",         label: "Queues" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .sb-wrap {
    margin: 0 32px;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Collapsed slim bar ── */
  .sb-wrap.collapsed {
    margin-top: 12px;
    margin-bottom: 0;
  }

  .sb-panel {
    background: #080c08;
    border: 1px solid #1a2e1a;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  /* Top scan-line effect */
  .sb-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #22c55e44, #22c55e, #22c55e44, transparent);
    animation: sb-scan 3s ease-in-out infinite;
    opacity: 0;
    transition: opacity 0.5s;
  }
  .sb-panel.all-ok::before {
    opacity: 1;
  }
  @keyframes sb-scan {
    0%   { transform: scaleX(0); opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: scaleX(1); opacity: 0; }
  }

  .sb-inner {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 0;
  }

  /* ── Header label ── */
  .sb-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #2a4a2a;
    margin-right: 16px;
    flex-shrink: 0;
    writing-mode: horizontal-tb;
    white-space: nowrap;
    transition: color 0.4s;
  }
  .sb-panel.all-ok .sb-label {
    color: #22c55e66;
  }

  /* ── Keys row ── */
  .sb-keys {
    display: flex;
    gap: 6px;
    align-items: center;
    flex: 1;
  }

  /* ── Single key ── */
  .sb-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    background: #0a100a;
    border: 1px solid #1a2a1a;
    border-radius: 2px;
    position: relative;
    cursor: default;
    opacity: 0;
    transform: scale(1.4);
    transition:
      opacity 0.25s ease,
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      border-color 0.3s,
      background 0.3s;
    min-width: 44px;
  }

  .sb-key.visible {
    opacity: 1;
    transform: scale(1);
  }

  .sb-key.status-ok {
    border-color: #1a3a1a;
  }
  .sb-key.status-error {
    border-color: #3a1a1a;
    background: #0f0808;
  }
  .sb-key.status-pending {
    border-color: #1a2a1a;
  }

  /* ── LED dot ── */
  .sb-led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
  }

  .sb-led.led-ok {
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e, 0 0 12px #22c55e66;
    animation: sb-breathe 2.5s ease-in-out infinite;
  }
  .sb-led.led-error {
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444, 0 0 12px #ef444466;
    animation: sb-pulse-red 1.2s ease-in-out infinite;
  }
  .sb-led.led-pending {
    background: #2a3a2a;
    box-shadow: none;
  }

  @keyframes sb-breathe {
    0%, 100% { opacity: 1; box-shadow: 0 0 4px #22c55e, 0 0 8px #22c55e44; }
    50%       { opacity: 0.7; box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e66; }
  }
  @keyframes sb-pulse-red {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  /* ── Key label ── */
  .sb-key-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #3a5a3a;
    transition: color 0.3s;
    white-space: nowrap;
  }
  .sb-key.status-ok .sb-key-label   { color: #22c55e99; }
  .sb-key.status-error .sb-key-label { color: #ef444499; }

  /* ── Right side: summary ── */
  .sb-summary {
    margin-left: auto;
    padding-left: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(8px);
    transition: opacity 0.4s 0.8s, transform 0.4s 0.8s;
  }
  .sb-summary.visible {
    opacity: 1;
    transform: translateX(0);
  }

  .sb-summary-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
    animation: sb-breathe 2s ease-in-out infinite;
  }
  .sb-summary-dot.has-errors {
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;
    animation: sb-pulse-red 1.2s ease-in-out infinite;
  }

  .sb-summary-text {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #22c55e;
  }
  .sb-summary-text.has-errors {
    color: #ef4444;
  }

  /* ── Bottom strip (collapsed mode) ── */
  .sb-strip {
    height: 2px;
    background: #1a2e1a;
    overflow: hidden;
  }
  .sb-strip-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e44, #22c55e, #22c55e44);
    transition: width 1s ease;
  }

  @media (max-width: 640px) {
    .sb-wrap { margin: 0 16px; }
    .sb-key { min-width: 36px; padding: 5px 7px; }
    .sb-key-label { font-size: 8px; }
    .sb-label { display: none; }
  }
`;

export function StatusBoard({ usage }: Props) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [summaryVisible, setSummaryVisible] = useState(false);

  const entries: ProductEntry[] = PRODUCTS.map(p => ({
    key: p.key,
    label: p.label,
    status: !usage[p.key]
      ? "pending"
      : usage[p.key].status === "ok"
        ? "ok"
        : "error",
  }));

  const okCount    = entries.filter(e => e.status === "ok").length;
  const errorCount = entries.filter(e => e.status === "error").length;
  const allOk      = okCount === entries.length;
  const pct        = Math.round((okCount / entries.length) * 100);

  // Stagger key animations in
  useEffect(() => {
    entries.forEach((e, i) => {
      setTimeout(() => {
        setVisibleKeys(prev => new Set([...prev, e.key]));
      }, i * 80);
    });
    setTimeout(() => setSummaryVisible(true), entries.length * 80 + 200);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`sb-wrap${allOk ? " collapsed" : ""}`}>
        <div className={`sb-panel${allOk ? " all-ok" : ""}`}>
          <div className="sb-inner">
            <span className="sb-label">sys // status</span>

            <div className="sb-keys">
              {entries.map(e => (
                <div
                  key={e.key}
                  className={[
                    "sb-key",
                    `status-${e.status}`,
                    visibleKeys.has(e.key) ? "visible" : "",
                  ].join(" ")}
                  title={
                    e.status === "error"
                      ? `${e.label}: ${usage[e.key]?.error ?? "unavailable"}`
                      : `${e.label}: ok`
                  }
                >
                  <div className={`sb-led led-${e.status}`} />
                  <span className="sb-key-label">{e.label}</span>
                </div>
              ))}
            </div>

            <div className={`sb-summary${summaryVisible ? " visible" : ""}`}>
              <div className={`sb-summary-dot${errorCount > 0 ? " has-errors" : ""}`} />
              <span className={`sb-summary-text${errorCount > 0 ? " has-errors" : ""}`}>
                {errorCount > 0
                  ? `${errorCount} fault${errorCount > 1 ? "s" : ""}`
                  : `${okCount}/${entries.length} nominal`
                }
              </span>
            </div>
          </div>

          {allOk && (
            <div className="sb-strip">
              <div className="sb-strip-fill" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}