/**
 * core/index.ts
 *
 * Single entry point for the staticflare library.
 * When published to npm, consumers import from "staticflare".
 * Internally, import from "core/types" or "core/detect-types" directly.
 *
 * Zero dependencies. Pure TypeScript.
 */

export type {
    // Primitives
    StaticComponent,
    StaticRoute,
    RouteMeta,
    PrerenderStrategy,
  
    // Manifest
    StaticManifest,
    ResolvedRoute,
  
    // Framework
    Framework,
    FrameworkAdapter,
  
    // Config
    StaticFlareConfig,
    CFCredentials,
    BuildConfig,
    ServeMode,
  
    // Adapters
    StorageAdapter,
    RoutingAdapter,
    CacheAdapter,
    PlatformAdapter,
  
    // Results
    UploadResult,
    RoutingResult,
    VerifyResult,
    AccountIntrospection,
    Zone,
    Bucket,
    Worker,
  
    // Deploy
    DeployOptions,
    DeployResult,
    DeployHooks,
    DeployPhase,
  
    // Vite plugin
    StaticFlarePluginOptions,
  
    // CLI
    InitAnswers,
  } from "./types"
  
  export type {
    DetectResult,
    DetectSource,
    WranglerConfig,
    ViteConfig,
    PackageJson,
  } from "./detect-types"
  
  // these are values (not just types) so no `type` keyword
  export {
    FRAMEWORK_DEPS,
    FRAMEWORK_OUTPUT_DIRS,
    FRAMEWORK_ROUTES_FILES,
  } from "./detect-types"
  
  // ── Render ────────────────────────────────────────────────────────────────────
  
  export type { Renderer, RenderOptions, RenderFailure } from "./render"
  
  export {
    renderRoute,
    renderRoutes,
    pathToR2Key,
  } from "./render"
  
  // ── Detect ────────────────────────────────────────────────────────────────────
  
  export { detectProject } from "./detect"