/**
 * adapters/rwsdk.ts
 *
 * RWSDK framework adapter for staticflare.
 * Bridges RWSDK's renderToString with the generic Renderer interface.
 * This is the only file in the project that knows about RWSDK.
 */

import type { Renderer, RenderOptions } from "../core/render"
import type { StaticRoute, StaticManifest, Framework } from "../core/types"
import { pathToR2Key } from "../core/render"

// ── Renderer ──────────────────────────────────────────────────────────────────

/**
 * Creates a staticflare Renderer using RWSDK's renderToString.
 *
 * Usage in vite plugin or CLI:
 *
 *   import { renderToString } from "rwsdk/worker"
 *   import { Document } from "@/app/Document"
 *   import { createRWSDKRenderer } from "./adapters/rwsdk"
 *
 *   const renderer = createRWSDKRenderer(renderToString, Document)
 *   const html = await renderer(route.component())
 */
export function createRWSDKRenderer(
  renderToString: (element: unknown, options?: object) => Promise<string>,
  document?: unknown,
): Renderer {
  return (output: unknown, options?: RenderOptions) =>
    renderToString(output, {
      Document: options?.document ?? document,
      injectRSCPayload: options?.injectRSCPayload ?? false,
    })
}

// ── Manifest loader ───────────────────────────────────────────────────────────

/**
 * Loads staticRoutes from the compiled RWSDK output.
 *
 * After `vite build`, RWSDK compiles src/app/pages/staticRoutes.ts into dist/.
 * We import the compiled module and extract the exported array.
 *
 * Expects the module to export one of:
 *   export const staticRoutes = [route("/about", About), ...]
 *   export const aboutRoute = route("/about", About)      ← spread individually
 */
export async function loadRWSDKRoutes(
  manifestPath: string,
): Promise<StaticRoute[]> {
  const mod = await import(manifestPath)

  // handle: export const staticRoutes = [...]
  if (Array.isArray(mod.staticRoutes)) {
    return mod.staticRoutes as StaticRoute[]
  }

  // handle: export const aboutRoute, export const changelogRoute etc.
  // collect all exports that look like a StaticRoute
  const routes: StaticRoute[] = []
  for (const key of Object.keys(mod)) {
    const val = mod[key]
    if (isStaticRoute(val)) {
      routes.push(val)
    }
  }

  if (routes.length > 0) return routes

  throw new Error(
    `staticflare: could not find static routes in ${manifestPath}.\n` +
    `Expected an export named "staticRoutes" (array) or individual route exports.\n` +
    `See: https://staticflare.dev/docs/rwsdk`,
  )
}

// ── FrameworkAdapter implementation ──────────────────────────────────────────

export const rwsdkAdapter = {
  name: "rwsdk" as Framework,

  async detect(projectRoot: string): Promise<boolean> {
    const { readFileSync, existsSync } = await import("node:fs")
    const { join } = await import("node:path")
    const pkgPath = join(projectRoot, "package.json")
    if (!existsSync(pkgPath)) return false
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    return "rwsdk" in deps || "@redwoodjs/sdk" in deps
  },

  async findManifest(buildOutput: string): Promise<string | null> {
    const { existsSync } = await import("node:fs")
    const { join } = await import("node:path")

    const candidates = [
      join(buildOutput, "app/pages/staticRoutes.js"),
      join(buildOutput, "app/pages/staticRoutes.mjs"),
      join(buildOutput, "staticRoutes.js"),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate
    }

    return null
  },

  async loadRoutes(manifestPath: string): Promise<StaticRoute[]> {
    return loadRWSDKRoutes(manifestPath)
  },

  defaultOutputDir(): string {
    return "dist"
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStaticRoute(val: unknown): val is StaticRoute {
  return (
    typeof val === "object" &&
    val !== null &&
    "path" in val &&
    "component" in val &&
    typeof (val as StaticRoute).path === "string" &&
    typeof (val as StaticRoute).component === "function"
  )
}