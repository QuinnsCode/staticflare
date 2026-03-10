/**
 * cf-client/workers.ts
 *
 * Worker route operations.
 * Used in bypass mode to exclude static paths from the worker.
 */

import type { CFHttpClient } from "./types"
import type {
  CFWorkerScript,
  CFWorkerRoute,
  CFWorkerRouteCreate,
} from "./types"

// ── Scripts ───────────────────────────────────────────────────────────────────

export async function listWorkers(
  client: CFHttpClient,
  accountId: string,
): Promise<CFWorkerScript[]> {
  const res = await client.getList<CFWorkerScript>(
    `/accounts/${accountId}/workers/scripts`,
  )
  return res.result
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function listWorkerRoutes(
  client: CFHttpClient,
  zoneId: string,
): Promise<CFWorkerRoute[]> {
  const res = await client.getList<CFWorkerRoute>(
    `/zones/${zoneId}/workers/routes`,
  )
  return res.result
}

export async function createWorkerRoute(
  client: CFHttpClient,
  zoneId: string,
  route: CFWorkerRouteCreate,
): Promise<CFWorkerRoute> {
  const res = await client.post<CFWorkerRoute>(
    `/zones/${zoneId}/workers/routes`,
    route,
  )
  return res.result
}

export async function deleteWorkerRoute(
  client: CFHttpClient,
  zoneId: string,
  routeId: string,
): Promise<void> {
  await client.delete(`/zones/${zoneId}/workers/routes/${routeId}`)
}

/**
 * Exclude paths from the worker entirely — bypass mode.
 * Creates a route with script: null so CF serves R2 directly.
 *
 * Pattern format: "myapp.com/about" (no wildcard needed for exact paths)
 */
export async function excludePathsFromWorker(
  client: CFHttpClient,
  zoneId: string,
  domain: string,
  paths: string[],
): Promise<CFWorkerRoute[]> {
  const results: CFWorkerRoute[] = []

  for (const path of paths) {
    const pattern = `${domain}${path}`
    const route = await createWorkerRoute(client, zoneId, {
      pattern,
      script: null,   // null = bypass worker, serve static directly
    })
    results.push(route)
  }

  return results
}

/**
 * Remove bypass exclusions — call when switching back to proxy mode
 * or when a static route becomes dynamic.
 */
export async function removePathExclusions(
  client: CFHttpClient,
  zoneId: string,
  domain: string,
  paths: string[],
): Promise<void> {
  const existing = await listWorkerRoutes(client, zoneId)
  const patterns = new Set(paths.map((p) => `${domain}${p}`))

  for (const route of existing) {
    if (patterns.has(route.pattern) && route.script === null) {
      await deleteWorkerRoute(client, zoneId, route.id)
    }
  }
}