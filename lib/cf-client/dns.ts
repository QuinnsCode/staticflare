/**
 * cf-client/dns.ts
 *
 * Zone + DNS record operations, and cache purge.
 */

import type { CFHttpClient } from "./types"
import type {
  CFZone,
  CFDnsRecord,
  CFDnsRecordCreate,
  CFCachePurgeRequest,
  CFCachePurgeResult,
} from "./types"

// ── Zones ─────────────────────────────────────────────────────────────────────

export async function listZones(
  client: CFHttpClient,
): Promise<CFZone[]> {
  const res = await client.getList<CFZone>("/zones")
  return res.result
}

export async function getZoneByDomain(
  client: CFHttpClient,
  domain: string,
): Promise<CFZone | null> {
  // strip subdomain — zone is always the root domain
  const root = rootDomain(domain)
  const res = await client.getList<CFZone>(`/zones?name=${root}`)
  return res.result[0] ?? null
}

// ── DNS records ───────────────────────────────────────────────────────────────

export async function listDnsRecords(
  client: CFHttpClient,
  zoneId: string,
): Promise<CFDnsRecord[]> {
  const res = await client.getList<CFDnsRecord>(
    `/zones/${zoneId}/dns_records`,
  )
  return res.result
}

export async function createDnsRecord(
  client: CFHttpClient,
  zoneId: string,
  record: CFDnsRecordCreate,
): Promise<CFDnsRecord> {
  const res = await client.post<CFDnsRecord>(
    `/zones/${zoneId}/dns_records`,
    record,
  )
  return res.result
}

export async function deleteDnsRecord(
  client: CFHttpClient,
  zoneId: string,
  recordId: string,
): Promise<void> {
  await client.delete(`/zones/${zoneId}/dns_records/${recordId}`)
}

// ── Cache purge ───────────────────────────────────────────────────────────────

/**
 * Purge specific URLs from CF cache.
 * Call after every deploy so stale HTML is evicted immediately.
 */
export async function purgeCache(
  client: CFHttpClient,
  zoneId: string,
  request: CFCachePurgeRequest,
): Promise<CFCachePurgeResult> {
  const res = await client.post<CFCachePurgeResult>(
    `/zones/${zoneId}/purge_cache`,
    request,
  )
  return res.result
}

export async function purgePaths(
  client: CFHttpClient,
  zoneId: string,
  domain: string,
  paths: string[],
): Promise<CFCachePurgeResult> {
  const files = paths.map((p) => `https://${domain}${p}`)
  return purgeCache(client, zoneId, { files })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "static.myapp.com" → "myapp.com" */
function rootDomain(domain: string): string {
  const parts = domain.split(".")
  return parts.length > 2 ? parts.slice(-2).join(".") : domain
}