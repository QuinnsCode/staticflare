/**
 * cli/init.ts
 *
 * Interactive setup wizard — asks 4 questions, writes staticflare.config.ts.
 * Runs once. After this, `staticflare deploy` handles everything.
 */

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"
import type { InitAnswers, StaticFlareConfig } from "../core/types"
import { detectProject } from "../core/detect"
import { createCFClient } from "../cf-client/http"
import { listZones } from "../cf-client/dns"
import { listBuckets } from "../cf-client/r2"

// ── Main ──────────────────────────────────────────────────────────────────────

export async function init(root = process.cwd()): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())))

  console.log("\n🔥 staticflare init\n")

  try {
    // ── Detect existing project setup ────────────────────────────────────────
    const detected = await detectProject(root)
    console.log(`  detected framework: ${detected.framework}`)
    console.log(`  detected output dir: ${detected.outDir}\n`)

    // ── Q1: DNS ──────────────────────────────────────────────────────────────
    console.log("Q1: Is your domain on Cloudflare?")
    console.log("    yes → full autopilot (DNS + R2 + routing automated)")
    console.log("    no  → we generate instructions for you\n")
    const dnsAnswer = await ask("  DNS on Cloudflare? (yes/no): ")
    const dns = dnsAnswer.toLowerCase().startsWith("y") ? "cloudflare" : "other"

    // ── Q2: Credentials ──────────────────────────────────────────────────────
    console.log("\nQ2: Cloudflare credentials")
    console.log("    needs: Account ID + API token with R2 + DNS write access")
    console.log("    tip: set these as env vars, we read from process.env\n")

    const accountId = await ask("  CF Account ID (or env var name): ")
    const apiToken = await ask("  CF API Token (or env var name): ")
    const zoneId = dns === "cloudflare"
      ? await ask("  CF Zone ID (or env var name, optional): ")
      : ""

    // verify token if they pasted a real one (not an env var name)
    if (!accountId.startsWith("CF_") && !apiToken.startsWith("CF_")) {
      process.stdout.write("\n  verifying token...")
      try {
        const client = createCFClient({ apiToken, accountId })
        const zones = await listZones(client)
        const buckets = await listBuckets(client, accountId)
        console.log(` ✓ (${zones.length} zone(s), ${buckets.length} bucket(s) found)`)
      } catch {
        console.log(" ✗ could not verify — continuing anyway")
      }
    }

    // ── Q3: Build output ─────────────────────────────────────────────────────
    console.log("\nQ3: Build configuration")

    const buildCommand = await ask(
      `  build command (default: ${detected.buildCommand ?? "npm run build"}): `,
    ) || detected.buildCommand || "npm run build"

    const outDir = await ask(
      `  output dir (default: ${detected.outDir}): `,
    ) || detected.outDir

    // ── Q4: Static routes + domain ───────────────────────────────────────────
    console.log("\nQ4: Static routes + domain")

    const routesFile = await ask(
      `  routes file convention (default: staticRoutes): `,
    ) || "staticRoutes"

    const domain = await ask(
      "  custom domain (optional, uses r2.dev if empty): ",
    ) || undefined

    const bucketSuggestion = domain
      ? domain.replace(/\./g, "-")
      : path.basename(root) + "-static"

    const bucket = await ask(
      `  R2 bucket name (default: ${bucketSuggestion}): `,
    ) || bucketSuggestion

    const modeAnswer = await ask(
      "  serve mode — proxy (worker fetches R2) or bypass (CF routes direct)? (proxy/bypass): ",
    )
    const mode = modeAnswer.toLowerCase().startsWith("b") ? "bypass" : "proxy"

    // ── Build answers ─────────────────────────────────────────────────────────
    const answers: InitAnswers = {
      dns,
      hosting: "byo",
      accountId,
      apiToken,
      zoneId: zoneId || undefined,
      bucket,
      domain,
      mode,
      buildCommand,
      outDir,
      routesFile,
    }

    // ── Write config ──────────────────────────────────────────────────────────
    const configPath = path.join(root, "staticflare.config.ts")
    const configContent = generateConfig(answers)
    fs.writeFileSync(configPath, configContent, "utf-8")
    console.log(`\n  ✓ wrote staticflare.config.ts`)

    // ── Update .env.example ───────────────────────────────────────────────────
    updateEnvExample(root, answers)
    console.log(`  ✓ updated .env.example`)

    // ── Print next steps ──────────────────────────────────────────────────────
    printNextSteps(answers, dns)

  } finally {
    rl.close()
  }
}

// ── Config generator ──────────────────────────────────────────────────────────

function generateConfig(a: InitAnswers): string {
  const credAccountId = a.accountId.startsWith("CF_")
    ? `process.env.${a.accountId}!`
    : `"${a.accountId}"`

  const credApiToken = a.apiToken.startsWith("CF_")
    ? `process.env.${a.apiToken}!`
    : `process.env.CF_API_TOKEN!`

  const credZoneId = a.zoneId
    ? a.zoneId.startsWith("CF_")
      ? `process.env.${a.zoneId}`
      : `"${a.zoneId}"`
    : undefined

  return `import type { StaticFlareConfig } from "staticflare"

const config: StaticFlareConfig = {
  dns: "${a.dns}",
  hosting: "byo",

  credentials: {
    accountId: ${credAccountId},
    apiToken: ${credApiToken},${credZoneId ? `\n    zoneId: ${credZoneId},` : ""}
  },

  bucket: "${a.bucket}",${a.domain ? `\n  domain: "${a.domain}",` : ""}
  mode: "${a.mode}",

  build: {
    command: "${a.buildCommand}",
    outDir: "${a.outDir}",
  },

  routesFile: "${a.routesFile}",
}

export default config
`
}

// ── .env.example updater ──────────────────────────────────────────────────────

function updateEnvExample(root: string, a: InitAnswers): void {
  const envPath = path.join(root, ".env.example")
  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8")
    : ""

  const lines = [
    "# staticflare",
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    a.zoneId ? "CF_ZONE_ID=" : null,
  ].filter(Boolean).join("\n")

  if (!existing.includes("CF_API_TOKEN")) {
    fs.writeFileSync(envPath, existing + "\n" + lines + "\n", "utf-8")
  }
}

// ── Next steps ────────────────────────────────────────────────────────────────

function printNextSteps(a: InitAnswers, dns: string): void {
  console.log("\n✓ staticflare is ready!\n")
  console.log("next steps:\n")

  if (!a.apiToken.startsWith("CF_")) {
    console.log("  1. add your CF credentials to .env:")
    console.log("     CF_API_TOKEN=your_token")
    console.log("     CF_ACCOUNT_ID=your_account_id")
    if (a.zoneId) console.log("     CF_ZONE_ID=your_zone_id")
    console.log("")
  }

  console.log("  2. add to vite.config.ts:")
  console.log('     import { staticflare } from "staticflare/vite"')
  console.log("     plugins: [..., staticflare()]  // always last\n")

  if (dns === "other") {
    console.log("  3. DNS records to add manually:")
    if (a.domain) {
      console.log(`     CNAME  ${a.domain}  →  ${a.bucket}.r2.cloudflarestorage.com`)
    } else {
      console.log(`     no custom domain — will use r2.dev subdomain`)
    }
    console.log("")
  }

  console.log("  then deploy:")
  console.log("     npx staticflare deploy\n")
  console.log("  or it runs automatically on:")
  console.log("     vite build\n")
}