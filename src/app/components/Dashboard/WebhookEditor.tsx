"use client";

/**
 * WebhookEditor — CLIENT component
 * Local state for webhook list. Test fires one POST.
 */

import { useState } from "react";
import type { Webhook, AlertConfig } from "@/lib/alerts/config";

type Props = {
  initialConfig: AlertConfig;
};

type TestState = "idle" | "testing" | "ok" | "fail";

export function WebhookEditor({ initialConfig }: Props) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialConfig.webhooks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testStates, setTestStates] = useState<Record<string, TestState>>({});

  function updateWebhook(id: string, patch: Partial<Webhook>) {
    setWebhooks((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    setSaved(false);
  }

  function addWebhook() {
    const w: Webhook = {
      id: crypto.randomUUID(),
      name: "",
      url: "",
      enabled: true,
    };
    setWebhooks((ws) => [...ws, w]);
    setSaved(false);
  }

  function removeWebhook(id: string) {
    setWebhooks((ws) => ws.filter((w) => w.id !== id));
    setSaved(false);
  }

  async function testWebhook(id: string, url: string) {
    setTestStates((s) => ({ ...s, [id]: "testing" }));
    try {
      const res = await fetch("/api/alerts/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setTestStates((s) => ({ ...s, [id]: res.ok ? "ok" : "fail" }));
    } catch {
      setTestStates((s) => ({ ...s, [id]: "fail" }));
    }
    // reset after 3s
    setTimeout(() => {
      setTestStates((s) => ({ ...s, [id]: "idle" }));
    }, 3000);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      // Fetch current config to merge webhooks back in
      const getRes = await fetch("/api/alerts/config");
      const current = await getRes.json();

      const res = await fetch("/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, webhooks }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Save failed.");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-section">
      <div className="webhooks-list">
        {webhooks.length === 0 && (
          <div className="webhooks-empty">
            No webhooks configured. Add one to receive alerts via Slack, Discord, or any HTTP endpoint.
          </div>
        )}

        {webhooks.map((w) => {
          const ts = testStates[w.id] ?? "idle";
          return (
            <div key={w.id} className={`webhook-row ${!w.enabled ? "webhook-row--disabled" : ""}`}>
              <div className="webhook-row-top">
                <input
                  type="checkbox"
                  className="tier-toggle"
                  checked={w.enabled}
                  onChange={(e) => updateWebhook(w.id, { enabled: e.target.checked })}
                />
                <input
                  className="field-input field-input--name"
                  type="text"
                  placeholder="Webhook name (e.g. Slack #alerts)"
                  value={w.name}
                  onChange={(e) => updateWebhook(w.id, { name: e.target.value })}
                />
                <button className="tier-remove" onClick={() => removeWebhook(w.id)}>✕</button>
              </div>

              <div className="webhook-row-url">
                <input
                  className="field-input field-input--url"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={w.url}
                  onChange={(e) => updateWebhook(w.id, { url: e.target.value })}
                />
                <button
                  className={`test-btn test-btn--${ts}`}
                  onClick={() => testWebhook(w.id, w.url)}
                  disabled={!w.url || ts === "testing"}
                >
                  {ts === "idle"    && "Test"}
                  {ts === "testing" && "Sending…"}
                  {ts === "ok"      && "✓ Sent"}
                  {ts === "fail"    && "✕ Failed"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="editor-actions">
        <button className="action-btn action-btn--ghost" onClick={addWebhook}>
          + Add webhook
        </button>
        <div style={{ flex: 1 }} />
        {error && <span className="save-error">{error}</span>}
        {saved && <span className="save-ok">✓ Saved</span>}
        <button className="action-btn action-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save webhooks"}
        </button>
      </div>
    </div>
  );
}