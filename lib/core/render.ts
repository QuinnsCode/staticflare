/**
 * core/render.ts
 *
 * Renders static route components to HTML strings.
 * Framework-agnostic — accepts a render function so any framework can plug in.
 * RWSDK adapter is the first implementation.
 */

import type { StaticRoute, ResolvedRoute, RouteMeta, Renderable } from "./types"

// ── Renderer interface ────────────────────────────────────────────────────────

/**
 * A render function — takes a component output and returns HTML.
 * Keeps core/ free of any direct framework import.
 *
 * RWSDK implementation:
 *   import { renderToString } from "rwsdk/worker"
 *   const renderer: Renderer = (el) => renderToString(el)
 */
export type Renderer<TOutput = Renderable> = (
  output: TOutput,
  options?: RenderOptions,
) => Promise<string>

export interface RenderOptions {
  /** Wrap output in a Document component — RWSDK's { Document } option */
  document?: unknown
  /** Inject RSC payload for hydration — default false for static pages */
  injectRSCPayload?: boolean
}

// ── Render a single route ─────────────────────────────────────────────────────

export async function renderRoute<TOutput = Renderable>(
  route: StaticRoute<TOutput>,
  renderer: Renderer<TOutput>,
  options?: RenderOptions,
): Promise<ResolvedRoute> {
  const output = route.component()
  const html = await renderer(output, options)

  return {
    path: route.path,
    r2Key: pathToR2Key(route.path),
    html,
    sizeBytes: byteLength(html),
    meta: route.meta,
  }
}

// ── Render many routes ────────────────────────────────────────────────────────

export async function renderRoutes<TOutput = Renderable>(
  routes: StaticRoute<TOutput>[],
  renderer: Renderer<TOutput>,
  options?: RenderOptions & {
    onStart?: (route: StaticRoute<TOutput>) => void
    onDone?: (resolved: ResolvedRoute) => void
    onError?: (route: StaticRoute<TOutput>, error: Error) => void
  },
): Promise<{ resolved: ResolvedRoute[]; failed: RenderFailure[] }> {
  const resolved: ResolvedRoute[] = []
  const failed: RenderFailure[] = []

  for (const route of routes) {
    options?.onStart?.(route)
    try {
      const result = await renderRoute(route, renderer, options)
      resolved.push(result)
      options?.onDone?.(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      failed.push({ route, error: err })
      options?.onError?.(route, err)
    }
  }

  return { resolved, failed }
}

export interface RenderFailure {
  route: StaticRoute
  error: Error
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a route path to an R2 object key.
 *
 * /about          → about.html
 * /docs/quickstart → docs/quickstart.html
 * /               → index.html
 */
export function pathToR2Key(path: string): string {
  const clean = path.replace(/^\//, "").replace(/\/$/, "")
  if (!clean) return "index.html"
  return `${clean}.html`
}

/** Byte length of a UTF-8 string */
function byteLength(str: string): number {
  return new TextEncoder().encode(str).length
}