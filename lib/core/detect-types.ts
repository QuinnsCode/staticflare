/**
 * staticflare/core/detect-types.ts (types)
 *
 * Framework detection + build output resolution shapes.
 */

import type { Framework } from "./types"

// ── Detection result ──────────────────────────────────────────────────────────

export interface DetectResult {
  framework: Framework
  outDir: string
  buildCommand: string | null
  routesFile: string | null     // path to staticRoutes.ts equivalent
  confidence: "high" | "medium" | "low"
  sources: DetectSource[]       // what files told us what
}

export interface DetectSource {
  file: string
  key: string                   // e.g. "build.outDir", "scripts.build"
  value: string
}

// ── Known framework configs ───────────────────────────────────────────────────

export interface WranglerConfig {
  name?: string
  build?: {
    command?: string
    upload?: {
      dir?: string
    }
  }
  assets?: {
    directory?: string
  }
}

export interface ViteConfig {
  build?: {
    outDir?: string
  }
}

export interface PackageJson {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

// ── Framework-specific hints ──────────────────────────────────────────────────

export const FRAMEWORK_DEPS: Record<string, Framework> = {
  "rwsdk":              "rwsdk",
  "@redwoodjs/sdk":     "rwsdk",
  "@tanstack/start":    "tanstack",
  "svelte":             "sveltekit",
  "@sveltejs/kit":      "sveltekit",
  "solid-start":        "solidstart",
  "@solidjs/start":     "solidstart",
  "@remix-run/react":   "remix",
  "next":               "next",
}

export const FRAMEWORK_OUTPUT_DIRS: Record<Framework, string[]> = {
  rwsdk:       ["dist"],
  tanstack:    [".output", "dist"],
  sveltekit:   [".svelte-kit", "build"],
  solidstart:  [".output", "dist"],
  remix:       ["build"],
  next:        [".next"],
  generic:     ["dist", "out", "build", "public"],
}

export const FRAMEWORK_ROUTES_FILES: Partial<Record<Framework, string>> = {
  rwsdk:    "staticRoutes",     // convention: src/app/pages/staticRoutes.ts
  tanstack: "staticRoutes",
  generic:  "staticRoutes",
}