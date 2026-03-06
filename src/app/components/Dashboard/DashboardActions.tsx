"use client";

/**
 * RefreshButton — CLIENT component
 * Just: useState for loading + router.refresh() to re-run server component
 */

import { useState } from "react";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    // Hard reload re-runs the server component, fetching fresh CF data
    window.location.reload();
  }

  return (
    <button
      className="action-btn"
      onClick={handleRefresh}
      disabled={loading}
    >
      {loading ? "↻ Refreshing…" : "↻ Refresh"}
    </button>
  );
}

/**
 * DisconnectButton — CLIENT component
 * Just: fetch DELETE + redirect
 */
export function DisconnectButton() {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    await fetch("/api/cf/connect", { method: "DELETE" });
    window.location.href = "/dashboard";
  }

  return (
    <button
      className="action-btn action-btn--ghost"
      onClick={handleDisconnect}
      disabled={loading}
    >
      {loading ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}