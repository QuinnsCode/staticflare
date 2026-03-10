#!/usr/bin/env node
/**
 * cli/setup-rwsdk.ts
 *
 * One-time setup script for RWSDK projects.
 * Wires staticflare into vite.config.ts and tsconfig.json automatically.
 *
 * Usage:
 *   npx staticflare setup-rwsdk
 *   npx staticflare setup-rwsdk --dry-run
 */

import fs from "node:fs"
import path from "node:path"

export async function setupRWSDK(
  root = process.cwd(),
  dryRun = false,
): Promise<void> {
  console.log("\n🔥 staticflare × RWSDK setup\n")

  const results: Array<{ file: string; status: "patched" | "skipped" | "not found" | "already set up" }> = []

  // ── 1. vite.config.ts ──────────────────────────────────────────────────────
  const vitePath = path.join(root, "vite.config.ts")

  if (!fs.existsSync(vitePath)) {
    results.push({ file: "vite.config.ts", status: "not found" })
  } else {
    const vite = fs.readFileSync(vitePath, "utf-8")

    if (vite.includes("staticflare")) {
      results.push({ file: "vite.config.ts", status: "already set up" })
    } else {
      // add import after last existing import
      let patched = vite.replace(
        /^(import .+\n)(?!import)/m,
        `$1import { staticflare } from "staticflare/vite"\n`,
      )

      // add plugin — find tailwindcss() or redwood() as anchor, add after
      // handles both tailwindcss() and redwood() as the last plugin
      patched = patched.replace(
        /(tailwindcss\(\))\s*\n(\s*\])/,
        `$1,\n$2    staticflare(),   // ← always last\n$2`,
      )

      // fallback: if tailwindcss not found, add after redwood()
      if (!patched.includes("staticflare()")) {
        patched = patched.replace(
          /(redwood\(\))\s*\n(\s*\])/,
          `$1,\n      staticflare(),   // ← always last\n$2`,
        )
      }

      if (!dryRun) fs.writeFileSync(vitePath, patched, "utf-8")
      results.push({ file: "vite.config.ts", status: "patched" })
    }
  }

  // ── 2. tsconfig.json ───────────────────────────────────────────────────────
  const tsconfigPath = path.join(root, "tsconfig.json")

  if (!fs.existsSync(tsconfigPath)) {
    results.push({ file: "tsconfig.json", status: "not found" })
  } else {
    const tsconfig = fs.readFileSync(tsconfigPath, "utf-8")

    if (tsconfig.includes('"node"') || tsconfig.includes("'node'")) {
      results.push({ file: "tsconfig.json", status: "already set up" })
    } else {
      // add "node" to the types array
      const patched = tsconfig.replace(
        /("types"\s*:\s*\[)([\s\S]*?)(\])/,
        (_, open, middle, close) => {
          const trimmed = middle.trimEnd()
          const comma = trimmed.endsWith(",") ? "" : ","
          return `${open}${middle.trimEnd()}${comma}\n      "node"\n    ${close}`
        },
      )

      if (!dryRun) fs.writeFileSync(tsconfigPath, patched, "utf-8")
      results.push({ file: "tsconfig.json", status: "patched" })
    }
  }

  // ── 3. staticflare.config.ts ───────────────────────────────────────────────
  const configPath = path.join(root, "staticflare.config.ts")

  if (fs.existsSync(configPath)) {
    results.push({ file: "staticflare.config.ts", status: "already set up" })
  } else {
    const example = generateExampleConfig()
    if (!dryRun) fs.writeFileSync(configPath, example, "utf-8")
    results.push({ file: "staticflare.config.ts", status: "patched" })
  }

  // ── 4. .env.example ───────────────────────────────────────────────────────
  const envPath = path.join(root, ".env.example")
  const envLines = [
    "\n# staticflare",
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    "CF_ZONE_ID=",
  ].join("\n")

  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, "utf-8")
    if (!existing.includes("CF_API_TOKEN")) {
      if (!dryRun) fs.writeFileSync(envPath, existing + envLines + "\n", "utf-8")
      results.push({ file: ".env.example", status: "patched" })
    } else {
      results.push({ file: ".env.example", status: "already set up" })
    }
  }

  // ── Print results ──────────────────────────────────────────────────────────
  console.log("results:\n")
  for (const r of results) {
    const icon = r.status === "patched" ? "✓"
      : r.status === "already set up" ? "─"
      : r.status === "not found" ? "✗"
      : "─"
    console.log(`  ${icon}  ${r.file.padEnd(28)} ${r.status}`)
  }

  if (dryRun) {
    console.log("\n  dry run — no files written\n")
    return
  }

  const patched = results.filter((r) => r.status === "patched")

  if (patched.length === 0) {
    console.log("\n  already set up — nothing to do\n")
    return
  }

  console.log("\nnext steps:\n")
  console.log("  1. fill in staticflare.config.ts with your CF credentials")
  console.log("  2. add CF_API_TOKEN + CF_ACCOUNT_ID to .env")
  console.log("  3. run: npx staticflare init   (for guided setup)")
  console.log("     or:  npx staticflare deploy  (if config is ready)\n")
  console.log("  your static routes deploy automatically on: npm run build\n")
}

// ── Example config ────────────────────────────────────────────────────────────

function generateExampleConfig(): string {
  return `import type { StaticFlareConfig } from "staticflare"

const config: StaticFlareConfig = {
  dns: "cloudflare",
  hosting: "byo",

  credentials: {
    accountId: process.env.CF_ACCOUNT_ID!,
    apiToken:  process.env.CF_API_TOKEN!,
    zoneId:    process.env.CF_ZONE_ID,
  },

  bucket: "my-app-static",
  // domain: "static.myapp.com",  // optional — uses r2.dev if omitted
  mode: "proxy",

  build: {
    command: "npm run build",
    outDir:  "dist",
  },

  routesFile: "staticRoutes",
}

export default config
`
}