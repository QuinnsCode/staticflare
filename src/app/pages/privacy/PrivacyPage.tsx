// src/app/pages/legal/PrivacyPage.tsx

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12, color: "#3a4e3a", marginBottom: 48,
        }}>
          last_updated: 2026-03-01
        </p>

        <Section title="1. The short version">
          <P>
            FlareUp is a read-only Cloudflare cost monitoring tool. Your API token is verified
            as read-only on connect, encrypted in an HttpOnly session cookie, and never stored
            in any database. We have no access to your Cloudflare infrastructure — only the
            analytics data you choose to view.
          </P>
        </Section>

        <Section title="2. What we collect">
          <P>
            <strong>Session cookie:</strong> Your Cloudflare API token is AES-GCM encrypted
            and stored in an HttpOnly, Secure, SameSite=Strict browser cookie. It expires after
            8 hours. JavaScript cannot read it. We cannot read it server-side without your
            browser presenting it.
          </P>
          <P>
            <strong>Usage data fetched on your behalf:</strong> When you load the dashboard,
            FlareUp queries the Cloudflare GraphQL Analytics API using your token. This data
            is rendered server-side and returned as HTML. It is not logged or stored.
          </P>
          <P>
            <strong>Alert configuration:</strong> If you configure budget tiers and webhooks,
            these are stored in Cloudflare KV keyed to your account ID. This contains no
            credentials — only threshold percentages and webhook URLs you provide.
          </P>
          <P>
            <strong>What we don't collect:</strong> Your Cloudflare credentials, KV data, D1
            data, R2 objects, Worker source code, DNS records, or any other infrastructure content.
            The read-only token cannot access these, and we never attempt to.
          </P>
        </Section>

        <Section title="3. Token security">
          <P>
            On connect, your token is validated against the Cloudflare{" "}
            <code style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#f48c06" }}>/user/tokens/verify</code>
            {" "}and permissions endpoints. FlareUp <strong>rejects any token with write, edit,
            deploy, or admin permissions</strong>. Only Account Analytics: Read is accepted.
          </P>
          <P>
            Your token is never written to a database, never logged, and never transmitted to
            any third party. It exists only in your encrypted session cookie and in-memory
            during a server-side request.
          </P>
        </Section>

        <Section title="4. Self-hosted alert worker">
          <P>
            If you deploy the optional background Worker to your own Cloudflare account, your
            API token is stored as a Cloudflare Worker secret — on your infrastructure, under
            your control. FlareUp (the hosted service) never sees this token.
          </P>
        </Section>

        <Section title="5. Who we share data with">
          <P>
            Nobody. FlareUp uses Cloudflare for hosting (Pages, Workers). Your alert config
            lives in Cloudflare KV. We have no advertising relationships, no analytics vendors,
            and no data broker arrangements.
          </P>
        </Section>

        <Section title="6. Data retention">
          <P>
            Session cookies expire after 8 hours. Alert configurations in KV persist until
            you delete them or remove the Worker. There is no account system — no email,
            no password, no profile to delete.
          </P>
        </Section>

        <Section title="7. Cookies">
          <P>
            One cookie: your encrypted session token. HttpOnly (no JS access), Secure (HTTPS
            only), SameSite=Strict (no cross-site requests). No tracking cookies, no analytics
            cookies, no third-party anything.
          </P>
        </Section>

        <Section title="8. Changes">
          <P>
            Material changes will update the date above. Continued use after changes means
            acceptance of the updated policy.
          </P>
        </Section>

        <Section title="9. Contact">
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