// src/app/pages/about/AboutPage.tsx

export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#060a06",
      color: "#e8f0e8",
      fontFamily: "'Barlow', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Barlow:wght@300;400;500&family=Barlow+Condensed:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060a06; }
        a { color: #f48c06; text-decoration: none; }
        a:hover { text-decoration: underline; color: #e85d04; }
        strong { color: #e8f0e8; }
        code {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px; color: #f48c06;
          background: rgba(232,93,4,0.08);
          padding: 2px 6px; border-radius: 2px;
          border: 1px solid rgba(232,93,4,0.15);
        }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "16px 32px",
        borderBottom: "1px solid rgba(232,93,4,0.15)",
        display: "flex", alignItems: "center",
        background: "rgba(6,10,6,0.92)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(24px)",
      }}>
        <a href="/" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 18, letterSpacing: "0.12em",
          color: "#f48c06",
          textShadow: "0 0 20px rgba(232,93,4,0.3)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#ef4444" }}>▲</span> FLAREUP
        </a>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 32px 100px" }}>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10, color: "#3a4e3a",
          textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 12,
        }}>
          // about
        </p>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 42, color: "#e8f0e8",
          letterSpacing: "0.06em", textTransform: "uppercase",
          marginBottom: 48,
        }}>
          About FlareUp
        </h1>

        <Section title="Why it exists">
          <P>
            Someone got an $8,000 Cloudflare bill from a runaway Workers AI loop.
            No alert fired. No dashboard caught it. The invoice just arrived.
          </P>
          <P>
            FlareUp exists so that never happens again — to you or anyone else.
            Real-time cost visibility across every Cloudflare product, with alerts
            that fire before the damage is done.
          </P>
        </Section>

        <Section title="What it does">
          <P>
            FlareUp queries the Cloudflare GraphQL Analytics API on your behalf
            and projects your month-end spend across Workers, Workers AI, KV, D1,
            R2, Durable Objects, and Queues. It tracks burn rate, detects spikes
            against your rolling average, and fires webhooks to Slack, Discord,
            or any HTTP endpoint.
          </P>
          <P>
            The hosted dashboard is read-only by design — your token is validated
            against Cloudflare's permissions API on connect, and write access is
            rejected outright. Your infrastructure stays untouchable.
          </P>
        </Section>

        <Section title="How it's built">
          <P>
            FlareUp runs entirely on Cloudflare's own stack —{" "}
            <code>Workers</code>, <code>Pages</code>, and <code>KV</code>.
            The hosted dashboard is a server-rendered RSC app on Pages.
            The optional background sentinel is a Worker with cron triggers
            that runs on your own account.
          </P>
          <P>
            No relay server. No database. No token storage. Session state lives
            in an AES-GCM encrypted HttpOnly cookie that expires in 8 hours.
          </P>
        </Section>

        <Section title="Who built it">
          <P>
            FlareUp is part of the <a href="https://qntbr.com">qntbr</a> family —
            a small set of developer tools built by Ryan Quinn. Same Q-prefix
            brand as <a href="https://qlave.dev">Qlave</a> (peer-to-peer video)
            and <a href="https://qntbr.com">QNTBR</a> (MTG virtual tabletop).
          </P>
          <P>
            It's open source. If Cloudflare changes pricing, PRs to{" "}
            <code>src/lib/cf/pricing.ts</code> are welcome.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions, bugs, or billing horror stories:{" "}
            <a href="mailto:theqntbr@gmail.com">theqntbr@gmail.com</a>
          </P>
        </Section>
      </main>

      <footer style={{
        padding: "24px 32px",
        borderTop: "1px solid rgba(232,93,4,0.1)",
        display: "flex", gap: 24, justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "#3a4e3a",
      }}>
        <a href="/" style={{ color: "#3a4e3a" }}>Home</a>
        <a href="/terms" style={{ color: "#3a4e3a" }}>Terms</a>
        <a href="/privacy" style={{ color: "#3a4e3a" }}>Privacy</a>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44, paddingBottom: 44, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 13, fontWeight: 700,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: "#f48c06", marginBottom: 16,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15, color: "#8a9e8a", lineHeight: 1.8, marginBottom: 12 }}>
      {children}
    </p>
  );
}