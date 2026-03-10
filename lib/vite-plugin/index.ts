/**
 * vite-plugin/index.ts
 *
 * Staticflare Vite plugin.
 * Hooks into buildEnd — runs after vite/rwsdk builds, never during dev.
 * Finds staticRoutes, renders to HTML, uploads to R2, wires routing.
 *
 * Usage in vite.config.ts:
 *
 *   import { staticflare } from "./vite-plugin"
 *
 *   export default defineConfig({
 *     plugins: [
 *       cloudflare({ viteEnvironment: { name: "worker" } }),
 *       redwood(),
 *       tailwindcss(),
 *       staticflare(),   ← always last
 *     ]
 *   })
 */

import path from "node:path"
import type { Plugin } from "vite"
import type { StaticFlarePluginOptions, StaticFlareConfig, DeployResult } from "../core/types"
import { detectProject } from "../core/detect"
import { renderRoutes } from "../core/render"
import { rwsdkAdapter } from "../adapters/rwsdk"
import { createCFClient } from "../cf-client/http"
import { ensureBucket, uploadObjects, ensureCustomDomain, enableManagedDomain } from "../cf-client/r2"
import { purgePaths } from "../cf-client/dns"
import { excludePathsFromWorker } from "../cf-client/workers"

export function staticflare(options: StaticFlarePluginOptions = {}): Plugin {
  return {
    name: "staticflare",
    apply: "build",           // build only — zero footprint in dev
    enforce: "post",          // run after all other plugins

    async buildEnd(buildError) {

      console.log('made it to buildEnd')
      // don't deploy if the build itself failed
      if (buildError) return

      const root = process.cwd()

      // ── Load config ─────────────────────────────────────────────────────────
      const config = await loadConfig(
        options.config ?? path.join(root, "staticflare.config.ts"),
      )

      if (!config) {
        console.warn(
          "\nstaticflare: no config found — skipping deploy.\n" +
          "Run `npx staticflare init` to set up.\n",
        )
        return
      }

      if (options.hooks?.onBuildStart) {
        options.hooks.onBuildStart()
      }

      // ── Detect framework + output dir ────────────────────────────────────────
      const detected = await detectProject(root)
      const outDir = config.build.outDir ?? detected.outDir

      if (options.hooks?.onBuildEnd) {
        options.hooks.onBuildEnd(outDir)
      }

      // ── Find staticRoutes ────────────────────────────────────────────────────
      const manifestPath = await rwsdkAdapter.findManifest(
        path.join(root, outDir),
      )

      if (!manifestPath) {
        console.warn(
          "\nstaticflare: could not find staticRoutes in build output.\n" +
          `Looked in: ${outDir}\n` +
          "Make sure you have a staticRoutes.ts file — see https://staticflare.dev/docs\n",
        )
        return
      }

      const routes = await rwsdkAdapter.loadRoutes(manifestPath)

      if (routes.length === 0) {
        console.log("\nstaticflare: no static routes found — nothing to deploy.\n")
        return
      }

      // ── Render ───────────────────────────────────────────────────────────────
      console.log(`\nstaticflare: rendering ${routes.length} static route(s)...`)

      const { renderToString } = await import("rwsdk/worker")
      const { Document } = await import(
        path.join(root, "src/app/Document")
      )
      const { createRWSDKRenderer } = await import("../adapters/rwsdk")
      const renderer = createRWSDKRenderer(renderToString, Document)

      const { resolved, failed } = await renderRoutes(routes, renderer, {
        injectRSCPayload: false,
        onStart: (route) => {
          options.hooks?.onRenderStart?.(route)
          process.stdout.write(`  rendering ${route.path}...`)
        },
        onDone: (resolved) => {
          options.hooks?.onRenderEnd?.(resolved)
          console.log(` ${(resolved.sizeBytes / 1024).toFixed(1)}kb`)
        },
        onError: (route, err) => {
          options.hooks?.onError?.(err, "render")
          console.error(`  ✗ ${route.path} — ${err.message}`)
        },
      })

      if (failed.length > 0) {
        console.warn(
          `\nstaticflare: ${failed.length} route(s) failed to render — skipping upload.\n`,
        )
        if (options.renderOnly) return
      }

      if (options.renderOnly) {
        console.log("\nstaticflare: renderOnly mode — skipping upload.\n")
        return
      }

      // ── Upload to R2 ─────────────────────────────────────────────────────────
      const { accountId, apiToken, zoneId } = config.credentials
      const client = createCFClient({ apiToken, accountId })

      console.log(`\nstaticflare: uploading to R2 bucket "${config.bucket}"...`)

      const { created } = await ensureBucket(client, accountId, {
        name: config.bucket,
      })

      if (created) {
        console.log(`  created bucket: ${config.bucket}`)
      }

      const objects = resolved.map((r) => ({ key: r.r2Key, html: r.html }))

      await uploadObjects(accountId, config.bucket, objects, apiToken, (key, i, total) => {
        process.stdout.write(`  uploading ${key} (${i + 1}/${total})...`)
      })

      resolved.forEach((r) => {
        options.hooks?.onUploadEnd?.({
          key: r.r2Key,
          url: `https://${config.domain ?? config.bucket}/${r.r2Key}`,
          sizeBytes: r.sizeBytes,
          ok: true,
        })
        console.log(" ✓")
      })

      // ── Wire routing ─────────────────────────────────────────────────────────
      const mode = options.mode ?? config.mode ?? "proxy"
      const paths = resolved.map((r) => r.path)

      if (mode === "bypass" && zoneId && config.domain) {
        options.hooks?.onRoutingStart?.()
        console.log(`\nstaticflare: configuring bypass routing...`)

        await excludePathsFromWorker(client, zoneId, config.domain, paths)

        await ensureCustomDomain(client, accountId, config.bucket, {
          domain: config.domain,
          enabled: true,
          zoneId,
        })

        options.hooks?.onRoutingEnd?.({
          mode: "bypass",
          domain: config.domain,
          paths,
          ok: true,
        })

        console.log(`  bypass active: ${config.domain}`)
      } else {
        // proxy mode — enable r2.dev for dev/staging if no custom domain
        if (!config.domain) {
          const managed = await enableManagedDomain(client, accountId, config.bucket)
          console.log(`\nstaticflare: serving via ${managed.domain}`)
        }
      }

      // ── Purge cache ──────────────────────────────────────────────────────────
      if (zoneId && config.domain) {
        options.hooks?.onCachePurge?.(paths)
        await purgePaths(client, zoneId, config.domain, paths)
        console.log(`\nstaticflare: cache purged for ${paths.length} path(s)`)
      }

      // ── Done ─────────────────────────────────────────────────────────────────
      const result: DeployResult = {
        routes: resolved.map((r) => ({
          key: r.r2Key,
          url: `https://${config.domain ?? `${config.bucket}.r2.dev`}/${r.r2Key}`,
          sizeBytes: r.sizeBytes,
          ok: true,
        })),
        routing: {
          mode,
          domain: config.domain ?? `${config.bucket}.r2.dev`,
          paths,
          ok: true,
        },
        duration: 0,
        ok: true,
      }

      options.hooks?.onDone?.(result)

      console.log(`\nstaticflare: ✓ deployed ${resolved.length} static route(s)\n`)
    },
  }
}

// ── Config loader ─────────────────────────────────────────────────────────────

async function loadConfig(configPath: string): Promise<StaticFlareConfig | null> {
  try {
    console.log('made it to loadConfig')
    // dynamic import works for both .ts (via vite) and .js
    const mod = await import(configPath)

    console.log('made it to loading mod or amptiness')

    return mod.default ?? mod.config ?? null
  } catch {
    return null
  }
}