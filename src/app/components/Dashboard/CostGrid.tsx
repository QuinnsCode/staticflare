"use client";
/**
 * CostGrid — per-service cost breakdown cards.
 * Accepts ProductResult<T> for each usage field so error states render inline.
 */

import type { CostBreakdown } from "@/lib/cf/pricing";
import type { ProductResult, WorkersUsage, WorkersAIUsage, KVUsage, D1Usage, R2Usage, DurableObjectsUsage, QueuesUsage } from "@/lib/cf/client";

type Props = {
  costs: CostBreakdown;
  projected: CostBreakdown;
  usage: {
    workers: ProductResult<WorkersUsage>;
    workersAI: ProductResult<WorkersAIUsage>;
    kv: ProductResult<KVUsage>;
    d1: ProductResult<D1Usage>;
    r2: ProductResult<R2Usage>;
    durableObjects: ProductResult<DurableObjectsUsage>;
    queues: ProductResult<QueuesUsage>;
  };
};

type ServiceRow = {
  key: string;
  label: string;
  icon: string;
  mtd: number;
  projected: number;
  detail: string;
  error?: string;
};

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

// Unwrap helper — returns data or null
function ok<T>(r: ProductResult<T>): T | null {
  return r.status === "ok" ? r.data : null;
}

export function CostGrid({ costs, projected, usage }: Props) {
  const workers = ok(usage.workers);
  const workersAI = ok(usage.workersAI);
  const kv = ok(usage.kv);
  const d1 = ok(usage.d1);
  const r2 = ok(usage.r2);
  const durableObjects = ok(usage.durableObjects);
  const queues = ok(usage.queues);

  const services: ServiceRow[] = [
    {
      key: "workers",
      label: "Workers",
      icon: "⚡",
      mtd: costs.workers,
      projected: projected.workers,
      detail: workers
        ? `${fmt(workers.requests)} reqs · ${fmt(workers.cpuTimeMs)}ms CPU`
        : "",
      error: usage.workers.status === "error" ? usage.workers.error : undefined,
    },
    {
      key: "workersAI",
      label: "Workers AI",
      icon: "🧠",
      mtd: costs.workersAI,
      projected: projected.workersAI,
      detail: workersAI
        ? `${fmt(workersAI.neurons)} neurons · ${fmt(workersAI.requests)} reqs`
        : "",
      error: usage.workersAI.status === "error" ? usage.workersAI.error : undefined,
    },
    {
      key: "kv",
      label: "KV",
      icon: "🗝",
      mtd: costs.kv,
      projected: projected.kv,
      detail: kv
        ? `${fmt(kv.reads)} reads · ${fmt(kv.writes)} writes`
        : "",
      error: usage.kv.status === "error" ? usage.kv.error : undefined,
    },
    {
      key: "d1",
      label: "D1",
      icon: "🗄",
      mtd: costs.d1,
      projected: projected.d1,
      detail: d1
        ? `${fmt(d1.rowsRead)} rows read · ${fmt(d1.rowsWritten)} written`
        : "",
      error: usage.d1.status === "error" ? usage.d1.error : undefined,
    },
    {
      key: "r2",
      label: "R2",
      icon: "🪣",
      mtd: costs.r2,
      projected: projected.r2,
      detail: r2
        ? `${fmt(r2.classAOps)} Class A · ${fmt(r2.classBOps)} Class B`
        : "",
      error: usage.r2.status === "error" ? usage.r2.error : undefined,
    },
    {
      key: "durableObjects",
      label: "Durable Objects",
      icon: "🔮",
      mtd: costs.durableObjects,
      projected: projected.durableObjects,
      detail: durableObjects
        ? `${fmt(durableObjects.requests)} requests`
        : "",
      error: usage.durableObjects.status === "error" ? usage.durableObjects.error : undefined,
    },
    {
      key: "queues",
      label: "Queues",
      icon: "📬",
      mtd: costs.queues,
      projected: projected.queues,
      detail: queues
        ? `${fmt(queues.operations)} operations`
        : "",
      error: usage.queues.status === "error" ? usage.queues.error : undefined,
    },
  ].sort((a, b) => b.projected - a.projected);

  const topKey = services[0]?.key;

  return (
    <div className="cost-grid">
      {services.map((s) => {
        const isTop = s.key === topKey && s.projected > 0;
        const isWarning = s.projected > 10;
        const hasError = !!s.error;

        return (
          <div
            key={s.key}
            className={[
              "cost-card",
              isTop ? "cost-card--top" : "",
              isWarning ? "cost-card--warn" : "",
              hasError ? "cost-card--error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="cost-card-header">
              <span className="cost-card-icon">{s.icon}</span>
              <span className="cost-card-label">{s.label}</span>
              {isTop && !hasError && <span className="cost-card-badge">TOP</span>}
              {hasError && <span className="cost-card-badge cost-card-badge--error">!</span>}
            </div>

            {hasError ? (
              <div className="cost-card-error-msg" title={s.error}>
                unavailable
              </div>
            ) : (
              <>
                <div className="cost-card-projected">
                  ${s.projected.toFixed(5)}
                </div>
                <div className="cost-card-mtd">
                  ${s.projected.toFixed(5)} MTD
                </div>
                {s.detail && (
                  <div className="cost-card-detail">{s.detail}</div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Base plan card */}
      <div className="cost-card cost-card--base">
        <div className="cost-card-header">
          <span className="cost-card-icon">☁</span>
          <span className="cost-card-label">Workers Paid</span>
        </div>
        <div className="cost-card-projected">${costs.base.toFixed(2)}</div>
        <div className="cost-card-mtd">base plan</div>
      </div>
    </div>
  );
}