/**
 * cf-client/r2.ts
 *
 * R2 bucket operations via CF API.
 * Each function takes a CFHttpClient — no global state.
 */

import type { CFHttpClient } from "./types"
import type {
  CFR2Bucket,
  CFR2BucketCreate,
  CFR2CustomDomain,
  CFR2CustomDomainCreate,
  CFR2ManagedDomain,
} from "./types"

// ── Buckets ───────────────────────────────────────────────────────────────────

export async function listBuckets(
  client: CFHttpClient,
  accountId: string,
): Promise<CFR2Bucket[]> {
  const res = await client.getList<CFR2Bucket>(
    `/accounts/${accountId}/r2/buckets`,
  )
  return res.result
}

export async function getBucket(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
): Promise<CFR2Bucket | null> {
  try {
    const res = await client.get<CFR2Bucket>(
      `/accounts/${accountId}/r2/buckets/${bucketName}`,
    )
    return res.result
  } catch {
    return null
  }
}

export async function createBucket(
  client: CFHttpClient,
  accountId: string,
  options: CFR2BucketCreate,
): Promise<CFR2Bucket> {
  const res = await client.post<CFR2Bucket>(
    `/accounts/${accountId}/r2/buckets`,
    options,
  )
  return res.result
}

/** Create only if it doesn't already exist — idempotent */
export async function ensureBucket(
  client: CFHttpClient,
  accountId: string,
  options: CFR2BucketCreate,
): Promise<{ bucket: CFR2Bucket; created: boolean }> {
  const existing = await getBucket(client, accountId, options.name)
  if (existing) return { bucket: existing, created: false }
  const bucket = await createBucket(client, accountId, options)
  return { bucket, created: true }
}

// ── Objects ───────────────────────────────────────────────────────────────────

/**
 * Upload an HTML file to R2.
 * Uses the S3-compatible endpoint — CF API doesn't have a REST upload endpoint.
 * Requires: accountId, bucket name, and an API token with R2 write access.
 */
export async function uploadObject(
  accountId: string,
  bucketName: string,
  key: string,
  html: string,
  apiToken: string,
): Promise<void> {
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
    body: html,
  })

  if (!res.ok) {
    throw new Error(
      `R2 upload failed: ${res.status} ${res.statusText} (key: ${key})`,
    )
  }
}

/** Upload many objects — sequential to avoid rate limits */
export async function uploadObjects(
  accountId: string,
  bucketName: string,
  objects: Array<{ key: string; html: string }>,
  apiToken: string,
  onProgress?: (key: string, index: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < objects.length; i++) {
    const { key, html } = objects[i]
    onProgress?.(key, i, objects.length)
    await uploadObject(accountId, bucketName, key, html, apiToken)
  }
}

// ── Custom domains ────────────────────────────────────────────────────────────

export async function listCustomDomains(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
): Promise<CFR2CustomDomain[]> {
  const res = await client.getList<CFR2CustomDomain>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/domains/custom`,
  )
  return res.result
}

export async function attachCustomDomain(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
  options: CFR2CustomDomainCreate,
): Promise<CFR2CustomDomain> {
  const res = await client.post<CFR2CustomDomain>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/domains/custom`,
    options,
  )
  return res.result
}

/** Attach only if not already attached — idempotent */
export async function ensureCustomDomain(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
  options: CFR2CustomDomainCreate,
): Promise<{ domain: CFR2CustomDomain; created: boolean }> {
  const existing = await listCustomDomains(client, accountId, bucketName)
  const match = existing.find((d) => d.domain === options.domain)
  if (match) return { domain: match, created: false }
  const domain = await attachCustomDomain(client, accountId, bucketName, options)
  return { domain, created: true }
}

// ── r2.dev managed domain ─────────────────────────────────────────────────────

/** Enable the r2.dev public URL — useful for dev/staging without a custom domain */
export async function enableManagedDomain(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
): Promise<CFR2ManagedDomain> {
  const res = await client.put<CFR2ManagedDomain>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/domains/managed`,
    { enabled: true },
  )
  return res.result
}

export async function getManagedDomain(
  client: CFHttpClient,
  accountId: string,
  bucketName: string,
): Promise<CFR2ManagedDomain> {
  const res = await client.get<CFR2ManagedDomain>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/domains/managed`,
  )
  return res.result
}