"use client";
// src/app/pages/landing/LandingPage.tsx
import { Flame, Zap, ShieldCheck, Terminal, Bell, Eye } from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Barlow', sans-serif;
    background: #060a06;
    color: #e8f0e8;
    -webkit-font-smoothing: antialiased;
  }
  a { text-decoration: none; color: inherit; }
  button { font-family: inherit; cursor: pointer; border: none; }

  :root {
    --orange:   #e85d04;
    --orange-l: #f48c06;
    --orange-g: rgba(232,93,4,0.22);
    --red:      #dc2626;
    --red-l:    #ef4444;
    --red-g:    rgba(220,38,38,0.18);
    --green:    #16a34a;
    --green-l:  #22c55e;
    --bg:       #060a06;
    --bg-2:     #0a0f0a;
    --bg-3:     #0f160f;
    --border:   rgba(255,255,255,0.05);
    --border-o: rgba(232,93,4,0.22);
    --border-r: rgba(220,38,38,0.2);
    --text:     #e8f0e8;
    --text-2:   #8a9e8a;
    --text-3:   #3a4e3a;
    --display:  'Barlow Condensed', sans-serif;
    --condensed:'Barlow Condensed', sans-serif;
    --mono:     'Share Tech Mono', monospace;
  }

  body::after {
    content: '';
    position: fixed; inset: 0;
    pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
  }

  nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 52px;
    border-bottom: 1px solid var(--border-o);
    position: sticky; top: 0; z-index: 100;
    background: rgba(6,10,6,0.92);
    backdrop-filter: blur(24px);
  }
  .wordmark {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--display); font-size: 20px; letter-spacing: 0.12em;
    color: var(--orange-l);
    text-shadow: 0 0 20px var(--orange-g), 0 0 40px rgba(232,93,4,0.1);
  }
  .wordmark-flame { color: var(--red-l); animation: flicker 3s infinite; }
  @keyframes flicker {
    0%,100%{ opacity:1; text-shadow: 0 0 8px var(--red-l); }
    92%{ opacity:1; } 93%{ opacity:0.7; text-shadow: none; }
    94%{ opacity:1; text-shadow: 0 0 12px var(--red-l); } 96%{ opacity:0.85; } 97%{ opacity:1; }
  }

  .status-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 3px;
    background: rgba(22,163,74,0.08); border: 1px solid rgba(34,197,94,0.2);
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--green-l);
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green-l); box-shadow: 0 0 6px var(--green-l);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.8)} }

  .nav-links { display: flex; align-items: center; gap: 6px; }
  .btn-ghost {
    padding: 8px 16px; border-radius: 3px;
    font-family: var(--condensed); font-size: 12px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    background: transparent; color: var(--text-2); transition: all 0.15s;
    border: 1px solid transparent;
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--border-o); }
  .btn-primary {
    padding: 9px 22px; border-radius: 3px;
    font-family: var(--condensed); font-size: 12px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    background: var(--orange); color: #fff;
    box-shadow: 0 2px 16px var(--orange-g); transition: all 0.15s;
    border: 1px solid var(--orange);
  }
  .btn-primary:hover { background: var(--orange-l); transform: translateY(-1px); box-shadow: 0 4px 24px var(--orange-g); }

  .btn-cta {
    padding: 16px 44px; border-radius: 3px;
    font-family: var(--display); font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase;
    background: linear-gradient(135deg, var(--red), var(--orange));
    color: #fff; border: none; cursor: pointer;
    box-shadow: 0 2px 32px var(--orange-g), 0 0 0 1px rgba(232,93,4,0.3);
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .btn-cta::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.06));
  }
  .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 48px rgba(232,93,4,0.4), 0 0 0 1px rgba(232,93,4,0.5); }
  .btn-outline {
    padding: 16px 40px; border-radius: 3px;
    font-family: var(--condensed); font-size: 12px; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    background: transparent; color: var(--text-2);
    border: 1px solid var(--border-o); transition: all 0.15s;
  }
  .btn-outline:hover { color: var(--orange-l); border-color: var(--orange-l); background: var(--orange-g); }

  .hero {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 100px 24px 80px; text-align: center; position: relative; overflow: hidden;
    min-height: calc(100vh - 61px);
  }
  .hero::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(232,93,4,0.09) 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 5% 100%, rgba(220,38,38,0.06) 0%, transparent 50%),
      radial-gradient(ellipse 40% 40% at 95% 90%, rgba(232,93,4,0.04) 0%, transparent 50%);
  }
  .hero::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(232,93,4,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232,93,4,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%);
  }

  .hero-alert {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 6px 18px; border-radius: 2px;
    border: 1px solid var(--border-r); background: rgba(220,38,38,0.06);
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--red-l); margin-bottom: 32px; position: relative; z-index: 1;
  }
  .alert-blink {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--red-l); box-shadow: 0 0 8px var(--red-l);
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .hero-title {
    font-family: var(--display);
    font-size: clamp(52px, 9vw, 108px); line-height: 0.95;
    letter-spacing: 0.04em; text-transform: uppercase;
    color: var(--text); max-width: 900px; margin-bottom: 12px; position: relative; z-index: 1;
  }
  .hero-title em { font-style: normal; color: var(--orange-l);
    text-shadow: 0 0 30px var(--orange-g), 0 0 60px rgba(232,93,4,0.12); }
  .hero-title .danger { color: var(--red-l); text-shadow: 0 0 30px var(--red-g); }

  .hero-sub {
    font-size: 17px; line-height: 1.8; color: var(--text-2);
    max-width: 500px; letter-spacing: 0.01em; margin-bottom: 8px; position: relative; z-index: 1;
  }
  .hero-aside {
    font-family: var(--mono); font-size: 11px; color: var(--text-3);
    letter-spacing: 0.1em; margin-bottom: 48px; position: relative; z-index: 1;
  }
  .hero-aside span { color: var(--orange); }

  .hero-cta {
    display: flex; gap: 12px; flex-wrap: wrap;
    justify-content: center; margin-bottom: 56px; position: relative; z-index: 1;
  }

  .terminal {
    background: var(--bg-3); border: 1px solid var(--border-o);
    border-radius: 4px; overflow: hidden; max-width: 480px; width: 100%;
    position: relative; z-index: 1;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,93,4,0.06), inset 0 1px 0 rgba(255,255,255,0.03);
  }
  .terminal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; background: rgba(232,93,4,0.06);
    border-bottom: 1px solid var(--border-o);
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3);
  }
  .terminal-header-dots { display: flex; gap: 6px; }
  .terminal-header-dots span { width: 8px; height: 8px; border-radius: 50%; }
  .terminal-header-dots span:nth-child(1) { background: var(--red); }
  .terminal-header-dots span:nth-child(2) { background: var(--orange); }
  .terminal-header-dots span:nth-child(3) { background: var(--green); }
  .terminal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
  .terminal-line { font-family: var(--mono); font-size: 12px; line-height: 1.6; display: flex; gap: 10px; }
  .t-prompt { color: var(--orange); }
  .t-ok     { color: var(--green-l); }
  .t-warn   { color: var(--orange-l); }
  .t-danger { color: var(--red-l); }
  .t-dim    { color: var(--text-3); }
  .t-val    { color: #e8f0e8; }
  .cursor {
    display: inline-block; width: 8px; height: 14px;
    background: var(--orange-l); margin-left: 2px;
    animation: cursor-blink 1.1s step-end infinite; vertical-align: text-bottom;
  }
  @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Two paths ── */
  .two-paths {
    padding: 88px 52px; display: flex; flex-direction: column; align-items: center;
    border-top: 1px solid var(--border);
  }
  .section-eyebrow {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-eyebrow::before, .section-eyebrow::after {
    content: ''; display: block; width: 32px; height: 1px; background: var(--text-3);
  }
  .section-title {
    font-family: var(--display); font-size: 36px; letter-spacing: 0.1em;
    text-transform: uppercase; text-align: center; color: var(--text); margin-bottom: 52px;
  }
  .paths-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 900px; width: 100%; }
  .path-card {
    background: var(--bg-2); border: 1px solid var(--border);
    border-radius: 4px; padding: 40px 36px;
    display: flex; flex-direction: column; gap: 16px;
    transition: border-color 0.2s, background 0.2s;
    position: relative; overflow: hidden;
  }
  .path-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .path-card.hosted::before { background: linear-gradient(90deg, var(--orange), var(--orange-l)); }
  .path-card.self::before   { background: linear-gradient(90deg, var(--red), var(--orange)); }
  .path-card.hosted:hover { border-color: var(--border-o); background: rgba(232,93,4,0.02); }
  .path-card.self:hover   { border-color: var(--border-r); background: rgba(220,38,38,0.02); }

  .path-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 2px; width: fit-content;
  }
  .path-tag.hosted { background: rgba(232,93,4,0.08); color: var(--orange-l); border: 1px solid var(--border-o); }
  .path-tag.self   { background: rgba(220,38,38,0.08); color: var(--red-l);    border: 1px solid var(--border-r); }

  .path-title { font-family: var(--display); font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text); }
  .path-desc  { font-size: 14px; line-height: 1.75; color: var(--text-2); }

  .path-example {
    background: var(--bg); border-radius: 3px; padding: 14px 16px;
    font-family: var(--mono); font-size: 12px; border: 1px solid var(--border);
    margin-top: 4px; line-height: 1.7;
  }
  .path-example.orange { color: var(--orange-l); border-color: var(--border-o); }
  .path-example.red    { color: #f87171;          border-color: var(--border-r); }
  .path-example .dim   { color: var(--text-3); }

  .path-features { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .path-feature {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: var(--text-2); line-height: 1.5;
  }
  .path-feature-dot {
    width: 5px; height: 5px; border-radius: 1px;
    margin-top: 7px; flex-shrink: 0; transform: rotate(45deg);
  }
  .hosted .path-feature-dot { background: var(--orange-l); }
  .self   .path-feature-dot { background: var(--red-l); }

  /* ── What we actually see callout ── */
  .what-we-see {
    max-width: 900px; width: 100%;
    background: var(--bg-2);
    border: 1px solid rgba(232,93,4,0.12);
    border-radius: 4px; padding: 28px 32px;
    margin-top: 24px;
  }
  .what-we-see-title {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .what-we-see-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .what-we-see-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
  .what-we-see-row {
    display: flex; gap: 10px; align-items: baseline;
    font-family: var(--mono); font-size: 11px;
  }
  .wws-perm  { color: var(--orange-l); min-width: 140px; flex-shrink: 0; }
  .wws-desc  { color: var(--text-3); }
  .wws-note  {
    margin-top: 16px; padding-top: 14px;
    border-top: 1px solid var(--border);
    font-family: var(--mono); font-size: 11px;
    color: var(--text-3); line-height: 1.65;
  }
  .wws-note strong { color: var(--text-2); }
  .wws-note em { color: var(--text-3); font-style: italic; }

  /* ── Features ── */
  .features {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--border);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  }
  .feature { background: var(--bg); padding: 48px 40px; transition: background 0.2s; }
  .feature:hover { background: var(--bg-2); }
  .feature-icon  { color: var(--orange-l); margin-bottom: 20px; }
  .feature-title {
    font-family: var(--condensed); font-size: 13px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--text); margin-bottom: 12px;
  }
  .feature-desc { font-size: 14px; line-height: 1.75; color: var(--text-2); }

  /* ── Incident ── */
  .incident {
    padding: 72px 52px; display: flex; flex-direction: column; align-items: center;
    border-bottom: 1px solid var(--border); position: relative; overflow: hidden;
  }
  .incident::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(220,38,38,0.04) 0%, transparent 65%);
    pointer-events: none;
  }
  .incident-card {
    max-width: 680px; width: 100%; background: var(--bg-2);
    border: 1px solid var(--border-r); border-radius: 4px; overflow: hidden;
    position: relative; z-index: 1;
  }
  .incident-header {
    display: flex; align-items: center; gap: 12px; padding: 16px 24px;
    background: rgba(220,38,38,0.08); border-bottom: 1px solid var(--border-r);
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  }
  .incident-level { color: var(--red-l); font-weight: bold; }
  .incident-time  { color: var(--text-3); margin-left: auto; }
  .incident-body  { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
  .incident-row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: var(--mono); font-size: 13px;
    padding-bottom: 10px; border-bottom: 1px solid var(--border);
  }
  .incident-row:last-child { border-bottom: none; padding-bottom: 0; }
  .incident-key      { color: var(--text-3); }
  .incident-val      { color: var(--text); }
  .incident-val.bad  { color: var(--red-l); font-weight: bold; }
  .incident-val.ok   { color: var(--green-l); }
  .incident-footer {
    padding: 14px 24px;
    background: rgba(22,163,74,0.05); border-top: 1px solid rgba(34,197,94,0.12);
    font-family: var(--mono); font-size: 11px; color: var(--green-l);
    letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px;
  }

  footer {
    padding: 28px 52px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-brand {
    font-family: var(--display); font-size: 13px; letter-spacing: 0.14em;
    display: flex; align-items: center; gap: 10px; color: var(--text-3);
  }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a {
    font-family: var(--condensed); font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text-3); transition: color 0.15s;
  }
  .footer-links a:hover { color: var(--orange-l); }

  @media (max-width: 768px) {
    nav { padding: 14px 20px; }
    .hero { padding: 72px 20px 60px; min-height: auto; padding-top: 56px; }
    .two-paths { padding: 56px 20px; }
    .paths-grid { grid-template-columns: 1fr; }
    .what-we-see-grid { grid-template-columns: 1fr; }
    .features { grid-template-columns: 1fr; }
    .incident { padding: 48px 20px; }
    footer { flex-direction: column; gap: 16px; text-align: center; padding: 24px 20px; }
  }
`;

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav>
        <a href="/">
          <span className="wordmark">
            <span className="wordmark-flame">▲</span> FLAREUP
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="status-pill"><span className="status-dot" />Systems nominal</span>
        </div>
        <div className="nav-links">
          <a href="https://github.com/QuinnsCode/flareup" target="_blank" rel="noopener">
            <button className="btn-ghost">GitHub</button>
          </a>
          <a href="/dashboard">
            <button className="btn-primary">Open Dashboard</button>
          </a>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero-alert">
            <span className="alert-blink" />
            ALERT — $8,000 Cloudflare bill detected — 03:47 UTC
          </div>
          <h1 className="hero-title">
            Stop the<br /><em>meltdown</em><br /><span className="danger">before</span> it starts.
          </h1>
          <p className="hero-sub">
            Real-time Cloudflare cost monitoring. Workers AI, KV, D1, R2 — tracked live, alerted fast, before the invoice arrives.
          </p>
          <p className="hero-aside">// <span>$0.011 / 1k neurons</span> adds up faster than you think</p>
          <div className="hero-cta">
            <a href="/dashboard"><button className="btn-cta">Connect your account</button></a>
            <a href="https://github.com/QuinnsCode/flareup" target="_blank" rel="noopener">
              <button className="btn-outline">Self-host free →</button>
            </a>
          </div>
          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-header-dots"><span /><span /><span /></div>
              <span>FLAREUP — BURN RATE MONITOR</span>
              <span>{new Date().toISOString().slice(0, 10)}</span>
            </div>
            <div className="terminal-body">
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-dim">checking workers AI usage...</span></div>
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-warn">neurons_today</span><span className="t-dim"> =</span><span className="t-val"> 847,293</span><span className="t-dim"> (free: 10k/day)</span></div>
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-warn">projected_month_end</span><span className="t-dim"> =</span><span className="t-danger"> $2,847.40</span></div>
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-dim">budget_threshold (75%)</span><span className="t-danger"> BREACHED</span></div>
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-ok">alert dispatched</span><span className="t-dim"> → slack #infra-alerts</span></div>
              <div className="terminal-line"><span className="t-prompt">›</span><span className="t-dim">awaiting input</span><span className="cursor" /></div>
            </div>
          </div>
        </section>

        {/* Two paths */}
        <section className="two-paths">
          <div className="section-eyebrow">Two ways to deploy</div>
          <h2 className="section-title">Pick your setup</h2>

          <div className="paths-grid">
            {/* Hosted */}
            <div className="path-card hosted">
              <span className="path-tag hosted"><Eye size={10} /> Hosted dashboard</span>
              <div className="path-title">Instant visibility</div>
              <div className="path-desc">
                Paste a read-only API token. We verify it has zero write access and show you a live cost dashboard.
                Your token transits our proxy to reach Cloudflare — we never store it anywhere.
                Close the tab and it's gone.
              </div>
              <div className="path-example orange">
                flareup.dev/dashboard<br />
                <span className="dim">→ token verified read-only</span><br />
                <span className="dim">→ lives in browser memory only</span><br />
                <span className="dim">→ gone on tab close</span>
              </div>
              <div className="path-features">
                {[
                  "Write permissions rejected on connect — we check the CF permissions API",
                  "Token in browser memory only — no database, no cookie, no log",
                  "Transits our Worker proxy to reach CF GraphQL (CORS limitation)",
                  "Workers · KV · D1 · R2 · Workers AI · Durable Objects",
                ].map(f => (
                  <div className="path-feature" key={f}><span className="path-feature-dot" />{f}</div>
                ))}
              </div>
            </div>

            {/* Self-hosted */}
            <div className="path-card self">
              <span className="path-tag self"><Bell size={10} /> Self-hosted alerts</span>
              <div className="path-title">Background sentinel</div>
              <div className="path-desc">
                Deploy a Worker to your own Cloudflare account. Your token never leaves your infra — not even a proxy hop.
                Runs every 5 minutes, fires spike detection, burn rate alerts, and daily reports.
              </div>
              <div className="path-example red">
                <span className="dim">$ </span>npx create-flareup<br />
                <span className="dim">$ </span>wrangler secret put CF_API_TOKEN<br />
                <span className="dim">$ </span>wrangler deploy<br />
                <span className="dim"># your account, your infra, $0 cost</span>
              </div>
              <div className="path-features">
                {[
                  "Token stored as a Worker secret in your own CF account — we never see it",
                  "Cron every 5min — spike detection against 7-day rolling average",
                  "Webhook to Slack, Discord, PagerDuty, or any HTTP endpoint",
                  "Runs on CF free tier — costs you nothing",
                ].map(f => (
                  <div className="path-feature" key={f}><span className="path-feature-dot" />{f}</div>
                ))}
              </div>
            </div>
          </div>

          {/* What we actually read */}
          <div className="what-we-see">
            <div className="what-we-see-title">What the token can actually read</div>
            <div className="what-we-see-grid">
              {[
                ["Account Analytics",     "Usage counts via GraphQL — not your data"],
                ["Billing",               "Invoice totals — how much you owe CF"],
                ["Workers AI",            "Neuron counts per model"],
                ["Workers KV Storage",    "Read/write op counts — not key contents"],
                ["Workers R2 Storage",    "Op counts + storage GB — not file contents"],
                ["D1",                    "Row read/write counts — not your rows"],
                ["Queues",                "Message op counts"],
                ["Stream",                "Minutes stored/delivered"],
                ["Cloudflare Images",     "Images stored + transformations"],
                ["Workers Scripts",       "Script names — not code"],
                ["Workers Observability", "CPU time, error rates"],
                ["Vectorize",             "Query counts + dimensions stored"],
              ].map(([perm, desc]) => (
                <div className="what-we-see-row" key={perm}>
                  <span className="wws-perm">{perm}</span>
                  <span className="wws-desc">{desc}</span>
                </div>
              ))}
            </div>
            <div className="wws-note">
              <strong>This is your accountant's view, not your admin's.</strong>{" "}
              Usage numbers and spend — not your DNS, not your code, not your stored data.
              You control every permission. Remove anything you're not comfortable with before creating the token.
              {" "}<em>// write access of any kind is rejected on connect</em>
            </div>
          </div>
        </section>

        {/* Features */}
        <div className="features">
          {[
            {
              icon: <Flame size={24} strokeWidth={1.6} />,
              title: "Workers AI — the big one",
              desc: "Neurons bill at $0.011/1k. A busy llama-3.3-70b day can torch your free tier in minutes. FlareUp tracks by model, projects month-end, and fires before the damage is done.",
            },
            {
              icon: <Zap size={24} strokeWidth={1.6} />,
              title: "Spike detection",
              desc: "Compares today's usage against your 7-day rolling average. If something 3× spikes — a runaway loop, a bot, a misconfigured retry — you hear about it in under 10 minutes.",
            },
            {
              icon: <ShieldCheck size={24} strokeWidth={1.6} />,
              title: "Read-only by force",
              desc: "Your token is validated against the CF permissions API on connect. If it has write access — deploy, delete, DNS — FlareUp rejects it. Your infra stays untouchable.",
            },
            {
              icon: <Terminal size={24} strokeWidth={1.6} />,
              title: "KV · D1 · R2 · DO",
              desc: "Every billable Cloudflare product tracked. KV reads, D1 rows, R2 ops, Durable Object duration. One dashboard. One projection. No blind spots.",
            },
            {
              icon: <Bell size={24} strokeWidth={1.6} />,
              title: "Alert tiers",
              desc: "Configure 25%, 50%, 75%, 100% budget tiers. Each tier fires its own webhooks, repeats on an interval, and can target different channels — #infra vs #on-call.",
            },
            {
              icon: <Eye size={24} strokeWidth={1.6} />,
              title: "Zero infra, zero cost",
              desc: "Hosted dashboard is static on Pages. Self-hosted Worker runs on the free tier. No database, no relay, no monthly bill for the monitoring itself.",
            },
          ].map(f => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* The incident */}
        <section className="incident">
          <div className="section-eyebrow" style={{ marginBottom: 32 }}>The incident that built this</div>
          <div className="incident-card">
            <div className="incident-header">
              <span className="alert-blink" />
              <span className="incident-level">SEV-1 BILLING INCIDENT</span>
              <span className="incident-time">detected 03:47 UTC</span>
            </div>
            <div className="incident-body">
              {[
                ["service",          "Workers AI — @cf/meta/llama-3.3-70b-instruct", ""],
                ["neurons_billed",   "8,291,847,392",  "bad"],
                ["invoice_total",    "$8,247.19",       "bad"],
                ["first_alert_sent", "never",           "bad"],
                ["monitoring_tool",  "none",            "bad"],
                ["resolution",       "built FlareUp",   ""],
              ].map(([k, v, cls]) => (
                <div className="incident-row" key={k}>
                  <span className="incident-key">{k}</span>
                  <span className={`incident-val${cls ? ` ${cls}` : ""}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="incident-footer">
              <span className="status-dot" />
              FLAREUP ACTIVE — this incident cannot happen again
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span className="footer-brand">
          <span style={{ color: "var(--orange-l)" }}>▲</span> FLAREUP —{" "}
          <a href="https://flareup.dev" style={{ color: "var(--text-2)", marginLeft: 4 }}>flareup.dev</a>
        </span>
        <div className="footer-links">
          <a href="https://github.com/QuinnsCode/flareup" target="_blank" rel="noopener">GitHub</a>
          <a href="/changelog">Changelog</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
      </footer>
    </>
  );
}