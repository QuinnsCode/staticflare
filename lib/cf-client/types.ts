/**
 * staticflare/cf-client/types.ts
 *
 * Cloudflare API response shapes.
 * Maps directly to what CF returns — no business logic here.
 */

// ── CF API envelope ───────────────────────────────────────────────────────────

/** Every CF API response wraps results in this envelope */
export interface CFResponse<T> {
    success: boolean
    errors: CFError[]
    messages: string[]
    result: T
  }
  
  export interface CFResponseList<T> {
    success: boolean
    errors: CFError[]
    messages: string[]
    result: T[]
    result_info?: CFResultInfo
  }
  
  export interface CFError {
    code: number
    message: string
    documentation_url?: string
  }
  
  export interface CFResultInfo {
    page: number
    per_page: number
    total_pages: number
    count: number
    total_count: number
  }
  
  // ── Token verification ────────────────────────────────────────────────────────
  
  export interface CFTokenVerifyResult {
    id: string
    status: "active" | "disabled" | "expired"
    not_before?: string
    expires_on?: string
  }
  
  export interface CFTokenPermission {
    id: string
    key: string
  }
  
  // ── Accounts ──────────────────────────────────────────────────────────────────
  
  export interface CFAccount {
    id: string
    name: string
    type: string
    settings?: CFAccountSettings
  }
  
  export interface CFAccountSettings {
    enforce_twofactor: boolean
    api_access_enabled: boolean | null
    use_account_custom_ns_by_default: boolean
  }
  
  // ── Zones (domains) ───────────────────────────────────────────────────────────
  
  export interface CFZone {
    id: string
    name: string
    status: "active" | "pending" | "initializing" | "moved" | "deleted" | "deactivated"
    paused: boolean
    type: "full" | "partial" | "secondary"
    name_servers: string[]
    original_name_servers: string[]
    activated_on: string
    created_on: string
    modified_on: string
  }
  
  export interface CFDnsRecord {
    id: string
    zone_id: string
    zone_name: string
    name: string
    type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "R2"
    content: string
    proxied: boolean
    ttl: number
    created_on: string
    modified_on: string
  }
  
  export interface CFDnsRecordCreate {
    type: CFDnsRecord["type"]
    name: string
    content: string
    proxied?: boolean
    ttl?: number
  }
  
  // ── R2 ────────────────────────────────────────────────────────────────────────
  
  export interface CFR2Bucket {
    name: string
    creation_date: string
    location?: string
    storage_class?: string
  }
  
  export interface CFR2BucketCreate {
    name: string
    locationHint?: "apac" | "eeur" | "enam" | "weur" | "wnam"
  }
  
  export interface CFR2CustomDomain {
    domain: string
    enabled: boolean
    status?: "active" | "initializing" | "error"
    minTLS?: "1.0" | "1.1" | "1.2" | "1.3"
    ciphers?: string[]
  }
  
  export interface CFR2CustomDomainCreate {
    domain: string
    enabled: boolean
    zoneId: string
    minTLS?: CFR2CustomDomain["minTLS"]
  }
  
  export interface CFR2ManagedDomain {
    bucketId: string
    domain: string
    enabled: boolean
  }
  
  // ── Workers ───────────────────────────────────────────────────────────────────
  
  export interface CFWorkerScript {
    id: string
    etag: string
    handlers: string[]
    modified_on: string
    created_on: string
  }
  
  export interface CFWorkerRoute {
    id: string
    pattern: string
    script: string | null
  }
  
  export interface CFWorkerRouteCreate {
    pattern: string
    script: string | null   // null = exclude from worker (bypass mode)
  }
  
  // ── Cache ─────────────────────────────────────────────────────────────────────
  
  export interface CFCachePurgeRequest {
    files?: string[]
    tags?: string[]
    hosts?: string[]
    prefixes?: string[]
  }
  
  export interface CFCachePurgeResult {
    id: string
  }
  
  // ── Client config ─────────────────────────────────────────────────────────────
  
  export interface CFClientConfig {
    apiToken: string
    accountId: string
    baseUrl?: string           // default: https://api.cloudflare.com/client/v4
    /** Retry config */
    maxRetries?: number        // default: 3
    retryDelay?: number        // default: 500ms
  }
  
  /** Raw HTTP client — thin fetch wrapper, no business logic */
  export interface CFHttpClient {
    get<T>(path: string): Promise<CFResponse<T>>
    getList<T>(path: string): Promise<CFResponseList<T>>
    post<T>(path: string, body?: unknown): Promise<CFResponse<T>>
    put<T>(path: string, body?: unknown): Promise<CFResponse<T>>
    delete<T>(path: string): Promise<CFResponse<T>>
  }