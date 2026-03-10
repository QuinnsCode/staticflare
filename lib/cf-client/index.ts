/**
 * cf-client/index.ts
 *
 * Cloudflare API client — types + implementations.
 * Import { createCFClient } and pass it to any operation function.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type {
    CFResponse,
    CFResponseList,
    CFError,
    CFResultInfo,
    CFTokenVerifyResult,
    CFTokenPermission,
    CFAccount,
    CFAccountSettings,
    CFZone,
    CFDnsRecord,
    CFDnsRecordCreate,
    CFR2Bucket,
    CFR2BucketCreate,
    CFR2CustomDomain,
    CFR2CustomDomainCreate,
    CFR2ManagedDomain,
    CFWorkerScript,
    CFWorkerRoute,
    CFWorkerRouteCreate,
    CFCachePurgeRequest,
    CFCachePurgeResult,
    CFClientConfig,
    CFHttpClient,
  } from "./types"
  
  // ── HTTP client ───────────────────────────────────────────────────────────────
  
  export { createCFClient, CFApiError } from "./http"
  
  // ── R2 ────────────────────────────────────────────────────────────────────────
  
  export {
    listBuckets,
    getBucket,
    createBucket,
    ensureBucket,
    uploadObject,
    uploadObjects,
    listCustomDomains,
    attachCustomDomain,
    ensureCustomDomain,
    enableManagedDomain,
    getManagedDomain,
  } from "./r2"
  
  // ── DNS ───────────────────────────────────────────────────────────────────────
  
  export {
    listZones,
    getZoneByDomain,
    listDnsRecords,
    createDnsRecord,
    deleteDnsRecord,
    purgeCache,
    purgePaths,
  } from "./dns"
  
  // ── Workers ───────────────────────────────────────────────────────────────────
  
  export {
    listWorkers,
    listWorkerRoutes,
    createWorkerRoute,
    deleteWorkerRoute,
    excludePathsFromWorker,
    removePathExclusions,
  } from "./workers"