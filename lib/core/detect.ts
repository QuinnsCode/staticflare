/**
 * core/detect.ts
 *
 * Detects framework, build output dir, and staticRoutes file location.
 * Reads wrangler.toml → vite.config → package.json → known dirs.
 * Node.js only — runs at build/deploy time, never in the worker.
 */

import fs from "node:fs"
import path from "node:path"
import type { DetectResult, DetectSource, WranglerConfig, PackageJson } from "./detect-types"
import {
  FRAMEWORK_DEPS,
  FRAMEWORK_OUTPUT_DIRS,
  FRAMEWORK_ROUTES_FILES,
} from "./detect-types"
import type { Framework } from "./types"

// ── Main ──────────────────────────────────────────────────────────────────────

export async function detectProject(root: string): Promise<DetectResult> {
  const sources: DetectSource[] = []

  const pkg = readJson<PackageJson>(path.join(root, "package.json"))
  const wrangler = readWrangler(root)

  // ── Framework ──────────────────────────────────────────────────────────────
  const framework = detectFramework(pkg, sources)

  // ── Build output dir ───────────────────────────────────────────────────────
  const outDir = detectOutDir(root, framework, wrangler, pkg, sources)

  // ── Build command ──────────────────────────────────────────────────────────
  const buildCommand = detectBuildCommand(wrangler, pkg, sources)

  // ── Routes file ────────────────────────────────────────────────────────────
  const routesFile = detectRoutesFile(root, framework)

  // ── Confidence ─────────────────────────────────────────────────────────────
  const confidence = sources.length >= 2 ? "high" : sources.length === 1 ? "medium" : "low"

  return { framework, outDir, buildCommand, routesFile, confidence, sources }
}

// ── Framework detection ───────────────────────────────────────────────────────

function detectFramework(
  pkg: PackageJson | null,
  sources: DetectSource[],
): Framework {
  if (!pkg) return "generic"

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }

  for (const [dep, framework] of Object.entries(FRAMEWORK_DEPS)) {
    if (dep in allDeps) {
      sources.push({ file: "package.json", key: `dependencies.${dep}`, value: dep })
      return framework
    }
  }

  return "generic"
}

// ── Output dir detection ──────────────────────────────────────────────────────

function detectOutDir(
  root: string,
  framework: Framework,
  wrangler: WranglerConfig | null,
  pkg: PackageJson | null,
  sources: DetectSource[],
): string {
  // 1. wrangler.toml build.upload.dir
  if (wrangler?.build?.upload?.dir) {
    sources.push({ file: "wrangler.toml", key: "build.upload.dir", value: wrangler.build.upload.dir })
    return wrangler.build.upload.dir
  }

  // 2. wrangler.toml assets.directory
  if (wrangler?.assets?.directory) {
    sources.push({ file: "wrangler.toml", key: "assets.directory", value: wrangler.assets.directory })
    return wrangler.assets.directory
  }

  // 3. vite.config build.outDir (parse the string, not execute)
  const viteOutDir = readViteOutDir(root)
  if (viteOutDir) {
    sources.push({ file: "vite.config.ts", key: "build.outDir", value: viteOutDir })
    return viteOutDir
  }

  // 4. package.json build script --outDir flag
  const scriptOutDir = parseOutDirFromScript(pkg?.scripts?.build)
  if (scriptOutDir) {
    sources.push({ file: "package.json", key: "scripts.build", value: scriptOutDir })
    return scriptOutDir
  }

  // 5. scan known dirs for this framework
  const candidates = FRAMEWORK_OUTPUT_DIRS[framework]
  for (const dir of candidates) {
    if (fs.existsSync(path.join(root, dir))) {
      sources.push({ file: "filesystem", key: "scan", value: dir })
      return dir
    }
  }

  // 6. fallback
  return "dist"
}

// ── Build command detection ───────────────────────────────────────────────────

function detectBuildCommand(
  wrangler: WranglerConfig | null,
  pkg: PackageJson | null,
  sources: DetectSource[],
): string | null {
  if (wrangler?.build?.command) {
    sources.push({ file: "wrangler.toml", key: "build.command", value: wrangler.build.command })
    return wrangler.build.command
  }

  if (pkg?.scripts?.build) {
    sources.push({ file: "package.json", key: "scripts.build", value: pkg.scripts.build })
    return "npm run build"
  }

  return null
}

// ── Routes file detection ─────────────────────────────────────────────────────

function detectRoutesFile(root: string, framework: Framework): string | null {
  const convention = FRAMEWORK_ROUTES_FILES[framework] ?? "staticRoutes"

  // common locations to scan
  const candidates = [
    `src/app/pages/${convention}.ts`,
    `src/app/pages/${convention}.tsx`,
    `app/pages/${convention}.ts`,
    `app/pages/${convention}.tsx`,
    `src/${convention}.ts`,
    `src/${convention}.tsx`,
    `${convention}.ts`,
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(root, candidate))) {
      return candidate
    }
  }

  return null
}

// ── File readers ──────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T
  } catch {
    return null
  }
}

function readWrangler(root: string): WranglerConfig | null {
  // try wrangler.jsonc first (your qstart uses this), then wrangler.toml
  for (const name of ["wrangler.jsonc", "wrangler.json", "wrangler.toml"]) {
    const filePath = path.join(root, name)
    if (!fs.existsSync(filePath)) continue
    try {
      const content = fs.readFileSync(filePath, "utf-8")
      // strip jsonc comments before parsing
      const stripped = content.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
      return JSON.parse(stripped) as WranglerConfig
    } catch {
      continue
    }
  }
  return null
}

function readViteOutDir(root: string): string | null {
  for (const name of ["vite.config.ts", "vite.config.js", "vite.config.mts"]) {
    const filePath = path.join(root, name)
    if (!fs.existsSync(filePath)) continue
    try {
      const content = fs.readFileSync(filePath, "utf-8")
      // naive regex — works for the common case: outDir: "dist"
      const match = content.match(/outDir\s*:\s*["']([^"']+)["']/)
      if (match) return match[1]
    } catch {
      continue
    }
  }
  return null
}

function parseOutDirFromScript(script: string | undefined): string | null {
  if (!script) return null
  const match = script.match(/--outDir\s+(\S+)/)
  return match?.[1] ?? null
}