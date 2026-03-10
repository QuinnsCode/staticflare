/**
 * core/types.ts
 *
 * The type system. Everything else imports from here.
 * Generics where possible — this is a library, not an app.
 */

// ── Primitives ────────────────────────────────────────────────────────────────

/**
 * Any renderable output — kept generic so this file has zero framework deps.
 * In practice this will be React.ReactNode, but we don't force that import here.
 */
export type Renderable = unknown

/**
 * Any function that returns renderable output with no runtime deps.
 * No props = no ctx, no db, no request — the static contract.
 */
export type StaticComponent<TOutput = Renderable> = () => TOutput

/** A path + component pair — the atomic unit of staticflare */
export interface StaticRoute<TOutput = Renderable> {
  path: string
  component: StaticComponent<TOutput>
  meta?: RouteMeta
}

/** Optional metadata per route */
export interface RouteMeta {
  title?: string
  description?: string
  prerender?: PrerenderStrategy
  ttl?: number               // cache TTL seconds, default 3600
  headers?: Record<string, string>
}

export type PrerenderStrategy =
  | "build"                  // render at build time (default)
  | "manual"                 // CLI only, not automatic
  | "isr"                    // on first request, cache to R2 (future)

// ── Manifest ──────────────────────────────────────────────────────────────────

/** The build artifact staticflare produces — describes what to deploy */
export interface StaticManifest<TMeta = RouteMeta> {
  routes: ResolvedRoute<TMeta>[]
  framework: Framework
  buildOutput: string
  generatedAt: string
  version: string
}

/** A route after build — has rendered HTML */
export interface ResolvedRoute<TMeta = RouteMeta> {
  path: string
  r2Key: string              // e.g. "about.html", "docs/quickstart.html"
  html: string
  sizeBytes: number
  meta?: TMeta
}

// ── Framework ─────────────────────────────────────────────────────────────────

export type Framework =
  | "rwsdk"
  | "tanstack"
  | "sveltekit"
  | "solidstart"
  | "remix"
  | "next"
  | "generic"

/** What a framework adapter needs to tell us */
export interface FrameworkAdapter<TOutput = Renderable> {
  name: Framework
  detect(projectRoot: string): Promise<boolean>
  findManifest(buildOutput: string): Promise<string | null>
  loadRoutes(manifestPath: string): Promise<StaticRoute<TOutput>[]>
  defaultOutputDir(): string
}

// ── Config ────────────────────────────────────────────────────────────────────

/** staticflare.config.ts — lives in user's project root */
export interface StaticFlareConfig {
  dns: "cloudflare" | "other"
  hosting: "byo" | "managed"
  credentials: CFCredentials
  bucket: string
  domain?: string
  mode?: ServeMode
  build: BuildConfig
  routesFile?: string        // default: "staticRoutes"
  workerName?: string
}

export interface CFCredentials {
  accountId: string
  apiToken: string
  zoneId?: string
}

export interface BuildConfig {
  command?: string
  outDir: string
}

export type ServeMode =
  | "proxy"                  // worker fetches from R2 (default)
  | "bypass"                 // CF routes directly to R2, worker never invoked

// ── Adapters ──────────────────────────────────────────────────────────────────

export interface StorageAdapter<TUploadOptions = unknown> {
  upload(key: string, html: string, options?: TUploadOptions): Promise<UploadResult>
  uploadMany(routes: ResolvedRoute[], options?: TUploadOptions): Promise<UploadResult[]>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

export interface RoutingAdapter<TRoutingOptions = unknown> {
  configureRouting(manifest: StaticManifest, options?: TRoutingOptions): Promise<RoutingResult>
  teardown(paths: string[]): Promise<void>
}

export interface CacheAdapter {
  purge(paths: string[]): Promise<void>
  purgeAll(): Promise<void>
}

export interface PlatformAdapter<
  TUploadOptions = unknown,
  TRoutingOptions = unknown,
> extends
    StorageAdapter<TUploadOptions>,
    RoutingAdapter<TRoutingOptions>,
    CacheAdapter {
  name: string
  verify(): Promise<VerifyResult>
  introspect(): Promise<AccountIntrospection>
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  key: string
  url: string
  sizeBytes: number
  ok: boolean
  error?: string
}

export interface RoutingResult {
  mode: ServeMode
  domain: string
  paths: string[]
  ok: boolean
  error?: string
}

export interface VerifyResult {
  ok: boolean
  accountId?: string
  accountName?: string
  scopes?: string[]
  error?: string
}

export interface AccountIntrospection {
  zones: Zone[]
  buckets: Bucket[]
  workers: Worker[]
}

export interface Zone {
  id: string
  name: string
  status: string
}

export interface Bucket {
  name: string
  createdAt: string
  location?: string
}

export interface Worker {
  id: string
  name: string
  routes: string[]
}

// ── Deploy ────────────────────────────────────────────────────────────────────

export interface DeployOptions {
  noBuild?: boolean
  force?: boolean
  dryRun?: boolean
  mode?: ServeMode
}

export interface DeployResult {
  routes: UploadResult[]
  routing: RoutingResult
  duration: number
  ok: boolean
  error?: string
}

// ── Lifecycle hooks ───────────────────────────────────────────────────────────

export interface DeployHooks<TOutput = Renderable> {
  onBuildStart?(): void
  onBuildEnd?(outDir: string): void
  onRenderStart?(route: StaticRoute<TOutput>): void
  onRenderEnd?(route: ResolvedRoute): void
  onUploadStart?(route: ResolvedRoute): void
  onUploadEnd?(result: UploadResult): void
  onRoutingStart?(): void
  onRoutingEnd?(result: RoutingResult): void
  onCachePurge?(paths: string[]): void
  onDone?(result: DeployResult): void
  onError?(error: Error, phase: DeployPhase): void
}

export type DeployPhase =
  | "build"
  | "render"
  | "upload"
  | "routing"
  | "cache"

// ── Vite plugin ───────────────────────────────────────────────────────────────

export interface StaticFlarePluginOptions {
  config?: string
  mode?: ServeMode
  hooks?: DeployHooks
  renderOnly?: boolean
}

// ── CLI ───────────────────────────────────────────────────────────────────────

export interface InitAnswers {
  dns: "cloudflare" | "other"
  hosting: "byo" | "managed"
  accountId: string
  apiToken: string
  zoneId?: string
  bucket: string
  domain?: string
  mode: ServeMode
  buildCommand?: string
  outDir: string
  routesFile: string
}