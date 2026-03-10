/**
 * cli/deploy.ts
 *
 * Deploy pipeline for the CLI.
 * Same logic as the vite plugin but driven from the command line.
 * Can run the build step itself, or skip if already built.
 *
 * Usage:
 *   npx staticflare deploy
 *   npx staticflare deploy --no-build
 *   npx staticflare deploy --dry-run
 *   npx staticflare deploy --mode bypass
 */

import path from "node:path"
import { execSync } from "node:child_process"
import type {
  StaticFlareConfig,
  DeployOptions,
  DeployResult,
  DeployHooks,
} from "../core/types"
import { detectProject } from "../core/detect"
import { renderRoutes } from "../core/render"
import { rwsdkAdapter } from "../adapters/rwsdk"
import { createCFClient } from "../cf-client/http"
import {
  ensureBucket,
  uploadObjects,
  ensureCustomDomain,
  enableManagedDomain,
} from "../cf-client/r2"
import { purgePaths } from "../cf-client/dns"
import { excludePathsFromWorker } from "../cf-client/workers"

// ── Deploy ────────────────────────────────────────────────────────────────────

export async function deploy(
  config: StaticFlareConfig,
  options: DeployOptions = {},
  hooks: DeployHooks = {},
): Promise<DeployResult> {
  const root = process.cwd()
  const start = Date.now()

  try {
    // ── Build ──────────────────────────────────────────────────────────────
    if (!options.noBuild && config.build.command) {
      hooks.onBuildStart?.()
      log(`running build: ${config.build.command}`)

      execSync(config.build.command, {
        cwd: root,
        stdio: "inherit",
      })

      hooks.onBuildEnd?.(config.build.outDir)
    }

    // ── Detect ─────────────────────────────────────────────────────────────
    const detected = await detectProject(root)
    const outDir = config.build.outDir ?? detected.outDir

    // ── Find routes ────────────────────────────────────────────────────────
    const manifestPath = await rwsdkAdapter.findManifest(
      path.join(root, outDir),
    )

    if (!manifestPath) {
      throw new Error(
        `Could not find staticRoutes in build output.\n` +
        `Looked in: ${outDir}\n` +
        `Make sure you have a staticRoutes.ts file.\n` +
        `See: https://staticflare.dev/docs`,
      )
    }

    const routes = await rwsdkAdapter.loadRoutes(manifestPath)

    if (routes.length === 0) {
      log("no static routes found — nothing to deploy.")
      return emptyResult(options.mode ?? config.mode ?? "proxy", config)
    }

    log(`found ${routes.length} static route(s)`)

    // ── Render ─────────────────────────────────────────────────────────────
    const { renderToString } = await import("rwsdk/worker")
    const { Document } = await import(path.join(root, "src/app/Document"))
    const { createRWSDKRenderer } = await import("../adapters/rwsdk")
    const renderer = createRWSDKRenderer(renderToString, Document)

    log("rendering...")

    const { resolved, failed } = await renderRoutes(routes, renderer, {
      injectRSCPayload: false,
      onStart: (route) => {
        hooks.onRenderStart?.(route)
        process.stdout.write(`  ${route.path}...`)
      },
      onDone: (r) => {
        hooks.onRenderEnd?.(r)
        process.stdout.write(` ${(r.sizeBytes / 1024).toFixed(1)}kb ✓\n`)
      },
      onError: (route, err) => {
        hooks.onError?.(err, "render")
        process.stdout.write(` ✗ ${err.message}\n`)
      },
    })

    if (failed.length > 0) {
      const names = failed.map((f) => f.route.path).join(", ")
      throw new Error(
        `${failed.length} route(s) failed to render: ${names}\n` +
        `These routes may have runtime dependencies (ctx, db, request).\n` +
        `Only components with no props can be static.`,
      )
    }

    // ── Dry run ────────────────────────────────────────────────────────────
    if (options.dryRun) {
      log("dry run — skipping upload.")
      return emptyResult(options.mode ?? config.mode ?? "proxy", config)
    }

    // ── Upload ─────────────────────────────────────────────────────────────
    const { accountId, apiToken, zoneId } = config.credentials
    const client = createCFClient({ apiToken, accountId })
    const mode = options.mode ?? config.mode ?? "proxy"

    log(`uploading to R2 bucket "${config.bucket}"...`)

    const { created } = await ensureBucket(client, accountId, {
      name: config.bucket,
    })

    if (created) log(`  created bucket: ${config.bucket}`)

    const objects = resolved.map((r) => ({ key: r.r2Key, html: r.html }))
    const uploadResults: Array<{ key: string; url: string; sizeBytes: number; ok: boolean }> = []

    await uploadObjects(
      accountId,
      config.bucket,
      objects,
      apiToken,
      (key, i, total) => {
        hooks.onUploadStart?.(resolved[i])
        process.stdout.write(`  ${key} (${i + 1}/${total})...`)
      },
    )

    for (const r of resolved) {
      const url = `https://${config.domain ?? `${config.bucket}.r2.dev`}/${r.r2Key}`
      const result = { key: r.r2Key, url, sizeBytes: r.sizeBytes, ok: true }
      uploadResults.push(result)
      hooks.onUploadEnd?.(result)
      process.stdout.write(" ✓\n")
    }

    // ── Routing ────────────────────────────────────────────────────────────
    const paths = resolved.map((r) => r.path)
    let domain = config.domain

    hooks.onRoutingStart?.()

    if (mode === "bypass" && zoneId && domain) {
      log("configuring bypass routing...")
      await excludePathsFromWorker(client, zoneId, domain, paths)
      await ensureCustomDomain(client, accountId, config.bucket, {
        domain,
        enabled: true,
        zoneId,
      })
      log(`  bypass active: ${domain}`)
    } else if (!domain) {
      const managed = await enableManagedDomain(client, accountId, config.bucket)
      domain = managed.domain
      log(`serving via: ${domain}`)
    }

    const routingResult = {
      mode,
      domain: domain ?? `${config.bucket}.r2.dev`,
      paths,
      ok: true,
    }

    hooks.onRoutingEnd?.(routingResult)

    // ── Cache purge ────────────────────────────────────────────────────────
    if (zoneId && domain) {
      hooks.onCachePurge?.(paths)
      await purgePaths(client, zoneId, domain, paths)
      log(`cache purged: ${paths.length} path(s)`)
    }

    // ── Done ───────────────────────────────────────────────────────────────
    const result: DeployResult = {
      routes: uploadResults,
      routing: routingResult,
      duration: Date.now() - start,
      ok: true,
    }

    hooks.onDone?.(result)

    log(`\n✓ deployed ${resolved.length} static route(s) in ${result.duration}ms`)
    log(`\nURLs:`)
    for (const r of uploadResults) {
      log(`  ${r.url}`)
    }

    return result

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    hooks.onError?.(err, "upload")
    logError(err.message)
    return {
      routes: [],
      routing: { mode: "proxy", domain: "", paths: [], ok: false },
      duration: Date.now() - start,
      ok: false,
      error: err.message,
    }
  }
}

// ── Config loader ─────────────────────────────────────────────────────────────

export async function loadConfig(
  root = process.cwd(),
): Promise<StaticFlareConfig | null> {
  const { register } = await import("node:module")
  const { pathToFileURL } = await import("node:url")

  // register tsx so node can import .ts files directly
  try {
    register("tsx/esm", pathToFileURL("./"))
  } catch {
    // already registered or tsx not available
  }

  const configPath = path.join(root, "staticflare.config.ts")
  try {
    const mod = await import(pathToFileURL(configPath).href)
    return mod.default ?? mod.config ?? null
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`staticflare: ${msg}`)
}

function logError(msg: string) {
  console.error(`staticflare error: ${msg}`)
}

function emptyResult(
  mode: "proxy" | "bypass",
  config: StaticFlareConfig,
): DeployResult {
  return {
    routes: [],
    routing: {
      mode,
      domain: config.domain ?? "",
      paths: [],
      ok: true,
    },
    duration: 0,
    ok: true,
  }
}