#!/usr/bin/env node
/**
 * cli/index.ts
 *
 * CLI entry point.
 * npx staticflare <command> [options]
 *
 * Commands:
 *   init                    → interactive setup wizard
 *   setup-rwsdk             → auto-wire into an RWSDK project
 *   setup-rwsdk --dry-run   → preview changes without writing
 *   deploy                  → build + render + upload + wire
 *   deploy --no-build       → skip build step
 *   deploy --dry-run        → render only, no upload
 *   deploy --mode bypass    → use bypass routing
 */

import { deploy, loadConfig } from "./deploy"
import { init } from "./init"
import { setupRWSDK } from "./setup-rwsdk"

const [, , command, ...args] = process.argv

async function main() {
  switch (command) {
    case "init": {
      await init()
      break
    }

    case "setup-rwsdk": {
      await setupRWSDK(process.cwd(), args.includes("--dry-run"))
      break
    }

    case "deploy": {
      const config = await loadConfig()

      if (!config) {
        console.error(
          "staticflare: no config found.\n" +
          "Run `npx staticflare init` to set up.\n",
        )
        process.exit(1)
      }

      const options = {
        noBuild: args.includes("--no-build"),
        dryRun:  args.includes("--dry-run"),
        force:   args.includes("--force"),
        mode:    args.includes("--mode")
          ? (args[args.indexOf("--mode") + 1] as "proxy" | "bypass")
          : undefined,
      }

      const result = await deploy(config, options)

      if (!result.ok) {
        process.exit(1)
      }

      break
    }

    default: {
      console.log(`
staticflare — SSG made easy for Cloudflare

usage:
  npx staticflare setup-rwsdk       auto-wire into an RWSDK project
  npx staticflare init              guided setup wizard
  npx staticflare deploy            build + deploy static routes to R2
  npx staticflare deploy --no-build skip build, deploy existing output
  npx staticflare deploy --dry-run  render only, skip upload
  npx staticflare deploy --mode bypass  use CF bypass routing
`)
      break
    }
  }
}

main().catch((err) => {
  console.error("staticflare:", err.message)
  process.exit(1)
})