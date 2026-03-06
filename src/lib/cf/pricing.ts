/**
 * Cloudflare pricing constants — source of truth for FlareUp cost estimates.
 *
 * ⚠️  These are ESTIMATES only. GraphQL analytics ≠ your actual invoice.
 *     Billable traffic excludes DDoS etc. Always verify at:
 *     https://dash.cloudflare.com → Billing → Billable Usage
 *
 * Last verified: March 2026
 * Source: https://developers.cloudflare.com/workers/platform/pricing/
 *
 * To update: submit a PR changing the relevant constant + update "Last verified"
 */

// ── Plan ──────────────────────────────────────────────────────────────────────
export const WORKERS_PAID_BASE = 5; // $5/mo minimum

// ── Workers ───────────────────────────────────────────────────────────────────
export const WORKERS = {
  includedRequests: 10_000_000,        // 10M requests/mo included
  pricePerMRequests: 0.50,             // $0.50 per million requests
  includedCpuMs: 30_000_000,           // 30M CPU ms/mo included
  pricePerMCpuMs: 0.02,               // $0.02 per million CPU ms
};

// ── Workers AI ────────────────────────────────────────────────────────────────
export const WORKERS_AI = {
  includedNeuronsPerDay: 10_000,       // 10k neurons/day free
  pricePerKNeurons: 0.011,             // $0.011 per 1,000 neurons

  // Per-model neuron costs (neurons per 1M tokens)
  // Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
  models: {
    "@cf/meta/llama-3.2-1b-instruct":              { inputNeuronsPerMToken: 2_457,    outputNeuronsPerMToken: 18_252 },
    "@cf/meta/llama-3.2-3b-instruct":              { inputNeuronsPerMToken: 4_625,    outputNeuronsPerMToken: 30_475 },
    "@cf/meta/llama-3.1-8b-instruct-fp8-fast":     { inputNeuronsPerMToken: 4_119,    outputNeuronsPerMToken: 34_868 },
    "@cf/meta/llama-3.1-8b-instruct":              { inputNeuronsPerMToken: 25_608,   outputNeuronsPerMToken: 75_147 },
    "@cf/meta/llama-3.1-70b-instruct-fp8-fast":    { inputNeuronsPerMToken: 26_668,   outputNeuronsPerMToken: 204_805 },
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast":    { inputNeuronsPerMToken: 26_668,   outputNeuronsPerMToken: 204_805 },
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b":{ inputNeuronsPerMToken: 45_170,   outputNeuronsPerMToken: 443_756 },
    "@cf/mistral/mistral-7b-instruct-v0.1":        { inputNeuronsPerMToken: 10_000,   outputNeuronsPerMToken: 17_300 },
    "@cf/mistralai/mistral-small-3.1-24b-instruct":{ inputNeuronsPerMToken: 31_876,   outputNeuronsPerMToken: 50_488 },
  } as Record<string, { inputNeuronsPerMToken: number; outputNeuronsPerMToken: number }>,
};

// ── KV ────────────────────────────────────────────────────────────────────────
export const KV = {
  includedReads: 10_000_000,           // 10M reads/mo included
  includedWrites: 1_000_000,           // 1M writes/mo included
  includedDeletes: 1_000_000,
  includedLists: 1_000_000,
  includedStorageGB: 1,

  pricePerMReads: 0.50,                // $0.50 per million reads
  pricePerMWrites: 5.00,              // $5.00 per million writes/deletes/lists
  pricePerGBStorage: 0.50,            // $0.50 per GB-month
};

// ── D1 ────────────────────────────────────────────────────────────────────────
export const D1 = {
  includedRowsRead: 25_000_000_000,    // 25B rows read/mo included
  includedRowsWritten: 50_000_000,     // 50M rows written/mo included
  includedStorageGB: 5,

  pricePerBRowsRead: 1.00,            // $1.00 per billion rows read
  pricePerMRowsWritten: 1.00,         // $1.00 per million rows written
  pricePerGBStorage: 0.75,            // $0.75 per GB-month
};

// ── R2 ────────────────────────────────────────────────────────────────────────
export const R2 = {
  includedStorageGB: 10,
  includedClassAOps: 1_000_000,        // 1M Class A ops/mo included
  includedClassBOps: 10_000_000,       // 10M Class B ops/mo included

  pricePerGBStorage: 0.015,           // $0.015 per GB-month
  pricePerMClassAOps: 4.50,           // $4.50 per million Class A ops
  pricePerMClassBOps: 0.36,           // $0.36 per million Class B ops
  // Egress: FREE (that's the whole point of R2)
};

// ── Durable Objects ───────────────────────────────────────────────────────────
export const DURABLE_OBJECTS = {
  includedRequests: 1_000_000,
  includedDurationGBs: 400_000,        // 400k GB-seconds included

  pricePerMRequests: 0.15,            // $0.15 per million requests
  pricePerMGBs: 12.50,               // $12.50 per million GB-seconds
};

// ── Queues ────────────────────────────────────────────────────────────────────
export const QUEUES = {
  includedOperations: 1_000_000,
  pricePerMOperations: 0.40,          // $0.40 per million operations
};

// ── Cost calculation ──────────────────────────────────────────────────────────

export type CostBreakdown = {
  workers: number;
  workersAI: number;
  kv: number;
  d1: number;
  r2: number;
  durableObjects: number;
  queues: number;
  base: number;
  total: number;
};

function overageCost(used: number, included: number, pricePerM: number): number {
  const overage = Math.max(0, used - included);
  return (overage / 1_000_000) * pricePerM;
}

export function estimateCosts(usage: {
  workers: { requests: number; cpuTimeMs: number };
  workersAI: { neurons: number };
  kv: { reads: number; writes: number; deletes: number; lists: number };
  d1: { rowsRead: number; rowsWritten: number };
  r2: { classAOps: number; classBOps: number; storageGB: number };
  durableObjects: { requests: number; durationMs: number };
  queues: { operations: number };
}): CostBreakdown {

  // Workers
  const workersCost =
    overageCost(usage.workers.requests, WORKERS.includedRequests, WORKERS.pricePerMRequests) +
    overageCost(usage.workers.cpuTimeMs, WORKERS.includedCpuMs, WORKERS.pricePerMCpuMs);

  // Workers AI — neurons beyond daily free tier
  // Daily free: 10k neurons. Monthly: 10k * 30 = 300k included
  const aiIncludedMonthly = WORKERS_AI.includedNeuronsPerDay * 30;
  const aiOverage = Math.max(0, usage.workersAI.neurons - aiIncludedMonthly);
  const workersAICost = (aiOverage / 1_000) * WORKERS_AI.pricePerKNeurons;

  // KV
  const kvCost =
    overageCost(usage.kv.reads, KV.includedReads, KV.pricePerMReads) +
    overageCost(usage.kv.writes, KV.includedWrites, KV.pricePerMWrites) +
    overageCost(usage.kv.deletes, KV.includedDeletes, KV.pricePerMWrites) +
    overageCost(usage.kv.lists, KV.includedLists, KV.pricePerMWrites);

  // D1
  const d1Cost =
    overageCost(usage.d1.rowsRead, D1.includedRowsRead, D1.pricePerBRowsRead * 1_000) +
    overageCost(usage.d1.rowsWritten, D1.includedRowsWritten, D1.pricePerMRowsWritten);

  // R2
  const r2Cost =
    overageCost(usage.r2.classAOps, R2.includedClassAOps, R2.pricePerMClassAOps) +
    overageCost(usage.r2.classBOps, R2.includedClassBOps, R2.pricePerMClassBOps) +
    Math.max(0, usage.r2.storageGB - R2.includedStorageGB) * R2.pricePerGBStorage;

  // Durable Objects
  const durationGBs = (usage.durableObjects.durationMs / 1000) * (128 / 1024); // assume 128MB
  const doCost =
    overageCost(usage.durableObjects.requests, DURABLE_OBJECTS.includedRequests, DURABLE_OBJECTS.pricePerMRequests) +
    overageCost(durationGBs, DURABLE_OBJECTS.includedDurationGBs, DURABLE_OBJECTS.pricePerMGBs * 1_000);

  // Queues
  const queuesCost = overageCost(
    usage.queues.operations,
    QUEUES.includedOperations,
    QUEUES.pricePerMOperations
  );

  const subtotal = workersCost + workersAICost + kvCost + d1Cost + r2Cost + doCost + queuesCost;

  return {
    workers: workersCost,
    workersAI: workersAICost,
    kv: kvCost,
    d1: d1Cost,
    r2: r2Cost,
    durableObjects: doCost,
    queues: queuesCost,
    base: WORKERS_PAID_BASE,
    total: WORKERS_PAID_BASE + subtotal,
  };
}

/**
 * Project month-end cost based on current MTD usage
 */
export function projectMonthEnd(costs: CostBreakdown): CostBreakdown {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const multiplier = daysInMonth / dayOfMonth;

  return {
    workers: costs.workers * multiplier,
    workersAI: costs.workersAI * multiplier,
    kv: costs.kv * multiplier,
    d1: costs.d1 * multiplier,
    r2: costs.r2 * multiplier,
    durableObjects: costs.durableObjects * multiplier,
    queues: costs.queues * multiplier,
    base: costs.base,
    total: costs.base + (costs.total - costs.base) * multiplier,
  };
}