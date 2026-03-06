// src/app/pages/legal/TermsPage.tsx

export default function TermsPage() {
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
          // legal
        </p>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 42, color: "#e8f0e8",
          letterSpacing: "0.06em", textTransform: "uppercase",
          marginBottom: 8,
        }}>
          Terms of Service
        </h1>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12, color: "#3a4e3a", marginBottom: 48,
        }}>
          last_updated: 2026-03-01
        </p>

        <Section title="1. What FlareUp is">
          <P>
            FlareUp is a read-only Cloudflare cost monitoring tool. It queries the Cloudflare
            GraphQL Analytics API on your behalf to display usage and projected billing across
            Workers, Workers AI, KV, D1, R2, Durable Objects, and Queues.
          </P>
          <P>
            FlareUp does not deploy, modify, delete, or interact with your Cloudflare
            infrastructure in any way. It only reads analytics data. The platform and its
            design are the original work of Ryan Quinn / qntbr. All rights reserved.
          </P>
        </Section>

        <Section title="2. It's free">
          <P>
            FlareUp is free to use. The hosted dashboard costs nothing. The self-hosted Worker
            runs on Cloudflare's free tier and costs nothing. There are no paid tiers, no trial
            timers, and no ads.
          </P>
          <P>
            This may change in the future. Any pricing changes will be communicated clearly
            and in advance.
          </P>
        </Section>

        <Section title="3. Your API token">
          <P>
            You provide a Cloudflare API token to use FlareUp. By doing so, you confirm that:
          </P>
          <P>
            <strong>(a)</strong> The token belongs to a Cloudflare account you own or are
            authorized to access.
          </P>
          <P>
            <strong>(b)</strong> You understand that FlareUp validates your token as read-only
            and rejects tokens with write permissions — but you are responsible for the
            permissions you grant.
          </P>
          <P>
            <strong>(c)</strong> FlareUp is not responsible for any access or charges that
            result from a token you provide that has broader permissions than intended.
          </P>
        </Section>

        <Section title="4. Cost estimates are estimates">
          <P>
            FlareUp's cost calculations are based on publicly available Cloudflare pricing and
            the GraphQL Analytics API. They are <strong>estimates only</strong> and do not
            represent your actual Cloudflare invoice.
          </P>
          <P>
            Cloudflare's billing may differ due to: DDoS traffic exclusions, rounding,
            committed use discounts, promotional credits, or API data lag (typically 5–15
            minutes). Always verify your actual charges at{" "}
            <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">
              dash.cloudflare.com → Billing
            </a>.
          </P>
          <P>
            FlareUp is not liable for billing decisions you make based on its estimates.
          </P>
        </Section>

        <Section title="5. Alert delivery is best-effort">
          <P>
            The optional background Worker fires webhook alerts based on usage thresholds.
            Alert delivery depends on your Cloudflare Worker being deployed, your secrets
            being set correctly, and your webhook endpoints being available.
          </P>
          <P>
            FlareUp makes no guarantee that alerts will fire within any particular time window
            or that they will be delivered successfully. Do not rely on FlareUp alerts as your
            only safeguard against unexpected Cloudflare charges.
          </P>
        </Section>

        <Section title="6. No warranties">
          <P>
            FlareUp is provided as-is. We make no guarantees about uptime, accuracy, or
            fitness for any particular purpose. The Cloudflare GraphQL API can return stale
            data, rate limit requests, or be unavailable. FlareUp inherits these limitations.
          </P>
        </Section>

        <Section title="7. Acceptable use">
          <P>
            Don't use FlareUp to access Cloudflare accounts you don't own. Don't attempt to
            circumvent the read-only token validation. Don't use FlareUp in any way that
            violates Cloudflare's Terms of Service. We reserve the right to block access
            with or without notice.
          </P>
        </Section>

        <Section title="8. Intellectual property">
          <P>
            The FlareUp platform, brand, and codebase are the original work and intellectual
            property of Ryan Quinn / qntbr. You may not copy, resell, or represent FlareUp's
            work as your own.
          </P>
          <P>
            FlareUp is built on open source components that retain their respective licenses.
            The self-hosted Worker is open source — you're free to fork and self-host it under
            those terms.
          </P>
        </Section>

        <Section title="9. Limitation of liability">
          <P>
            To the maximum extent permitted by law, FlareUp and its creator are not liable for
            any damages arising from your use of the service — including but not limited to
            unexpected Cloudflare charges, missed alerts, incorrect cost projections, or
            service interruptions.
          </P>
        </Section>

        <Section title="10. Changes">
          <P>
            These terms may be updated. Material changes will update the date above. Continued
            use of FlareUp after changes constitutes acceptance.
          </P>
        </Section>

        <Section title="11. Contact">
          <P>
            Questions? <a href="mailto:theqntbr@gmail.com">theqntbr@gmail.com</a>
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