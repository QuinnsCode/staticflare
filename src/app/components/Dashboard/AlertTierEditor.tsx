"use client";

/**
 * AlertTierEditor — CLIENT component
 * Local state for editing tiers. One POST to /api/alerts/config on save.
 * All rendering structure comes from the server component.
 */

import { useState } from "react";
import type { AlertTier, AlertConfig } from "@/lib/alerts/config";

type Props = {
  initialConfig: AlertConfig;
};

export function AlertTierEditor({ initialConfig }: Props) {
  const [config, setConfig] = useState<AlertConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function updateTier(id: string, patch: Partial<AlertTier>) {
    setConfig((c) => ({
      ...c,
      tiers: c.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    setSaved(false);
  }

  function addTier() {
    const newTier: AlertTier = {
      id: crypto.randomUUID(),
      name: "new alert",
      budgetPercent: 0.9,
      webhookIds: [],
      enabled: true,
    };
    setConfig((c) => ({ ...c, tiers: [...c.tiers, newTier] }));
    setSaved(false);
  }

  function removeTier(id: string) {
    setConfig((c) => ({ ...c, tiers: c.tiers.filter((t) => t.id !== id) }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
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

  const sortedTiers = [...config.tiers].sort(
    (a, b) => a.budgetPercent - b.budgetPercent
  );

  return (
    <div className="editor-section">
      {/* Budget input */}
      <div className="field-row">
        <label className="field-label">Monthly budget ($)</label>
        <input
          className="field-input field-input--sm"
          type="number"
          min={1}
          step={1}
          value={config.monthlyBudget}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              monthlyBudget: Number(e.target.value),
            }))
          }
        />
        <span className="field-hint">Alerts fire as % of this amount</span>
      </div>

      {/* Tiers list */}
      <div className="tiers-list">
        {sortedTiers.map((tier) => (
          <div key={tier.id} className={`tier-row ${!tier.enabled ? "tier-row--disabled" : ""}`}>
            <div className="tier-row-left">
              <input
                type="checkbox"
                className="tier-toggle"
                checked={tier.enabled}
                onChange={(e) => updateTier(tier.id, { enabled: e.target.checked })}
              />
              <input
                className="field-input field-input--name"
                type="text"
                value={tier.name}
                placeholder="tier name"
                onChange={(e) => updateTier(tier.id, { name: e.target.value })}
              />
            </div>

            <div className="tier-row-right">
              <div className="field-row--inline">
                <input
                  className="field-input field-input--pct"
                  type="number"
                  min={1}
                  max={200}
                  step={5}
                  value={Math.round(tier.budgetPercent * 100)}
                  onChange={(e) =>
                    updateTier(tier.id, {
                      budgetPercent: Number(e.target.value) / 100,
                    })
                  }
                />
                <span className="field-unit">% of budget</span>
              </div>

              <div className="field-row--inline">
                <input
                  className="field-input field-input--pct"
                  type="number"
                  min={0}
                  step={15}
                  value={tier.repeatEveryMinutes ?? 0}
                  onChange={(e) =>
                    updateTier(tier.id, {
                      repeatEveryMinutes: Number(e.target.value) || undefined,
                    })
                  }
                />
                <span className="field-unit">min repeat (0=once)</span>
              </div>

              <button
                className="tier-remove"
                onClick={() => removeTier(tier.id)}
                title="Remove tier"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="editor-actions">
        <button className="action-btn action-btn--ghost" onClick={addTier}>
          + Add tier
        </button>
        <div style={{ flex: 1 }} />
        {error && <span className="save-error">{error}</span>}
        {saved && <span className="save-ok">✓ Saved</span>}
        <button className="action-btn action-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}