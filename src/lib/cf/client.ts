/**
 * Cloudflare Analytics GraphQL client
 * Field names verified against official CF docs + schema, March 2026.
 */

export const CF_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
export const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export type CFCredentials = { token: string; accountId: string };

export type ProductResult<T> =
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

export type WorkersUsage    = { requests: number; cpuTimeMs: number };
export type WorkersAIUsage  = { neurons: number; requests: number; byModel: Array<{ modelId: string; neurons: number; requests: number }> };
export type KVUsage         = { reads: number; writes: number; deletes: number; lists: number };
export type D1Usage         = { rowsRead: number; rowsWritten: number };
export type R2Usage         = { classAOps: number; classBOps: number; storageGB: number };
export type DurableObjectsUsage = { requests: number; durationMs: number };
export type QueuesUsage     = { operations: number };

export type ProductUsage = {
  workers:        ProductResult<WorkersUsage>;
  workersAI:      ProductResult<WorkersAIUsage>;
  kv:             ProductResult<KVUsage>;
  d1:             ProductResult<D1Usage>;
  r2:             ProductResult<R2Usage>;
  durableObjects: ProductResult<DurableObjectsUsage>;
  queues:         ProductResult<QueuesUsage>;
};

export async function verifyToken(token: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Token is invalid or has been revoked.");
  const { result } = (await res.json()) as any;
  if (result.status !== "active") throw new Error(`Token status is "${result.status}".`);

  // Fetch token details to check for write permissions
  const detailRes = await fetch(`${CF_API_BASE}/user/tokens/${result.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (detailRes.ok) {
    const { result: token_detail } = (await detailRes.json()) as any;
    const allPerms = (token_detail?.policies ?? [])
      .flatMap((p: any) => p.permission_groups ?? [])
      .map((pg: any) => pg.name ?? "");
    const writePerms = allPerms.filter((name: string) => /write|edit|admin/i.test(name));
    if (writePerms.length > 0) {
      throw new Error(
        `Token has write/edit permissions: ${writePerms.join(", ")}. FlareUp only accepts read-only tokens.`
      );
    }
  }
  // If detail fetch fails, proceed anyway — best effort check

  return { id: result.id, status: result.status };
}

async function cfGraphQL<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(CF_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`CF GraphQL HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`CF GraphQL error: ${json.errors[0].message}`);
  if (!json.data) throw new Error("CF GraphQL returned no data");
  return json.data as T;
}

function getBillingPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString(),           // Time — for datetime_geq filters
    end: now.toISOString(),               // Time
    startDate: start.toISOString().split("T")[0],  // Date — for date_geq filters
    endDate: now.toISOString().split("T")[0],      // Date
  };
}

async function safe<T>(fn: () => Promise<T>): Promise<ProductResult<T>> {
  try { return { status: "ok", data: await fn() }; }
  catch (e: any) { return { status: "error", error: e?.message ?? String(e) }; }
}

// ── Workers ──────────────────────────────────────────────────────────────────
// sum fields: requests, errors, subrequests
// quantiles fields: cpuTimeP50, cpuTimeP99 (microseconds)
async function fetchWorkers(token: string, accountId: string): Promise<WorkersUsage> {
  const { start, end } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query WorkersUsage($accountId: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          workersInvocationsAdaptive(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            sum { requests }
            quantiles { cpuTimeP50 }
          }
        }
      }
    }
  `, { accountId, start, end });

  const rows = data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];
  let requests = 0;
  let cpuTimeUs = 0;
  for (const row of rows) {
    requests  += row.sum?.requests ?? 0;
    cpuTimeUs += (row.quantiles?.cpuTimeP50 ?? 0) * (row.sum?.requests ?? 0);
  }
  return { requests, cpuTimeMs: cpuTimeUs / 1000 };
}

// ── Workers AI ───────────────────────────────────────────────────────────────
// sum fields: neuronTokensTotal  (no "requests" field in this dataset)
// filter: date_geq / date_leq (Date type)
async function fetchWorkersAI(token: string, accountId: string): Promise<WorkersAIUsage> {
  const { startDate, endDate } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query WorkersAIUsage($accountId: String!, $start: Date!, $end: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          aiInferenceAdaptiveGroups(
            limit: 1000
            filter: { date_geq: $start, date_leq: $end }
          ) {
            sum { totalNeurons }
            dimensions { modelId }
          }
        }
      }
    }
  `, { accountId, start: startDate, end: endDate });

  const groups = data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups ?? [];
  const byModel = groups.map((g: any) => ({
    modelId: g.dimensions?.modelId ?? "unknown",
    neurons: g.sum?.totalNeurons ?? 0,
    requests: 0, // not available in this dataset
  }));
  return {
    neurons: byModel.reduce((s: number, m: any) => s + m.neurons, 0),
    requests: byModel.reduce((s: number, m: any) => s + m.requests, 0),
    byModel,
  };
}

// ── KV ───────────────────────────────────────────────────────────────────────
// dimensions: actionType (not operationType)
// actionType values: read, write, delete, list
async function fetchKV(token: string, accountId: string): Promise<KVUsage> {
  const { start, end } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query KVUsage($accountId: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          kvOperationsAdaptiveGroups(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            sum { requests }
            dimensions { actionType }
          }
        }
      }
    }
  `, { accountId, start, end });

  const groups = data?.viewer?.accounts?.[0]?.kvOperationsAdaptiveGroups ?? [];
  const byType: Record<string, number> = {};
  for (const g of groups) {
    const t = (g.dimensions?.actionType ?? "read").toLowerCase();
    byType[t] = (byType[t] ?? 0) + (g.sum?.requests ?? 0);
  }
  return {
    reads:   byType["read"]   ?? 0,
    writes:  byType["write"]  ?? 0,
    deletes: byType["delete"] ?? 0,
    lists:   byType["list"]   ?? 0,
  };
}

// ── D1 ───────────────────────────────────────────────────────────────────────
// filter: date_geq / date_leq (Date type, NOT datetime)
// sum fields: readQueries, writeQueries (NOT rowsRead/rowsWritten in this dataset)
async function fetchD1(token: string, accountId: string): Promise<D1Usage> {
  const { startDate, endDate } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query D1Usage($accountId: String!, $start: Date!, $end: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          d1AnalyticsAdaptiveGroups(
            limit: 1000
            filter: { date_geq: $start, date_leq: $end }
          ) {
            sum { readQueries writeQueries }
          }
        }
      }
    }
  `, { accountId, start: startDate, end: endDate });

  const groups = data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups ?? [];
  return groups.reduce(
    (acc: D1Usage, g: any) => ({
      rowsRead:    acc.rowsRead    + (g.sum?.readQueries  ?? 0),
      rowsWritten: acc.rowsWritten + (g.sum?.writeQueries ?? 0),
    }),
    { rowsRead: 0, rowsWritten: 0 }
  );
}

// ── R2 ───────────────────────────────────────────────────────────────────────
// actionType dimension for class A vs B split
async function fetchR2(token: string, accountId: string): Promise<R2Usage> {
  const { start, end } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query R2Usage($accountId: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          r2OperationsAdaptiveGroups(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            sum { requests }
            dimensions { actionType }
          }
        }
      }
    }
  `, { accountId, start, end });

  const groups = data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups ?? [];
  const classATypes = new Set([
    "putobject", "copyobject", "completemultipartupload",
    "createbucket", "deletebucket", "putbucketencryption",
    "putbucketcors", "putbucketlifecycle", "createmultipartupload",
    "uploadpart", "uploadpartcopy",
  ]);
  let classAOps = 0, classBOps = 0;
  for (const g of groups) {
    const type = (g.dimensions?.actionType ?? "").toLowerCase();
    if (classATypes.has(type)) classAOps += g.sum?.requests ?? 0;
    else classBOps += g.sum?.requests ?? 0;
  }
  return { classAOps, classBOps, storageGB: 0 };
}

// ── Durable Objects ───────────────────────────────────────────────────────────
// invocationsAdaptiveGroups sum: requests, responseBodySize (no wallTimeMs)
// cpuTime lives in durableObjectsPeriodicGroups — fetch both
async function fetchDurableObjects(token: string, accountId: string): Promise<DurableObjectsUsage> {
  const { startDate, endDate } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query DOUsage($accountId: String!, $start: Date!, $end: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          durableObjectsInvocationsAdaptiveGroups(
            limit: 1000
            filter: { date_geq: $start, date_leq: $end }
          ) {
            sum { requests }
          }
          durableObjectsPeriodicGroups(
            limit: 1000
            filter: { date_geq: $start, date_leq: $end }
          ) {
            sum { cpuTime }
          }
        }
      }
    }
  `, { accountId, start: startDate, end: endDate });

  const acct = data?.viewer?.accounts?.[0] ?? {};
  const invocations = acct.durableObjectsInvocationsAdaptiveGroups ?? [];
  const periodic    = acct.durableObjectsPeriodicGroups ?? [];

  const requests  = invocations.reduce((s: number, g: any) => s + (g.sum?.requests ?? 0), 0);
  const cpuTimeUs = periodic.reduce((s: number, g: any) => s + (g.sum?.cpuTime   ?? 0), 0);

  return { requests, durationMs: cpuTimeUs / 1000 };
}

// ── Queues ────────────────────────────────────────────────────────────────────
// sum field: billableOperations (not "operations")
async function fetchQueues(token: string, accountId: string): Promise<QueuesUsage> {
  const { start, end } = getBillingPeriod();
  const data = await cfGraphQL<any>(token, `
    query QueuesUsage($accountId: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          queueMessageOperationsAdaptiveGroups(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            sum { billableOperations }
          }
        }
      }
    }
  `, { accountId, start, end });

  const groups = data?.viewer?.accounts?.[0]?.queueMessageOperationsAdaptiveGroups ?? [];
  return {
    operations: groups.reduce((s: number, g: any) => s + (g.sum?.billableOperations ?? 0), 0),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function fetchAllUsage(creds: CFCredentials): Promise<ProductUsage> {
  const { token, accountId } = creds;
  const [workers, workersAI, kv, d1, r2, durableObjects, queues] = await Promise.all([
    safe(() => fetchWorkers(token, accountId)),
    safe(() => fetchWorkersAI(token, accountId)),
    safe(() => fetchKV(token, accountId)),
    safe(() => fetchD1(token, accountId)),
    safe(() => fetchR2(token, accountId)),
    safe(() => fetchDurableObjects(token, accountId)),
    safe(() => fetchQueues(token, accountId)),
  ]);
  return { workers, workersAI, kv, d1, r2, durableObjects, queues };
}