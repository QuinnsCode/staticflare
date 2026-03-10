import type { StaticFlareConfig } from "./lib/core/types"

const config: StaticFlareConfig = {
  dns: "cloudflare",
  hosting: "byo",

  credentials: {
    accountId: process.env.CF_ACCOUNT_ID!,
    apiToken:  process.env.CF_API_TOKEN!,
    zoneId:    process.env.CF_ZONE_ID,
  },

  bucket: process.env.CF_R2_BUCKET ?? "staticflare-static",
  domain: process.env.CF_DOMAIN,
  mode:   (process.env.STATICFLARE_MODE as "proxy" | "bypass") ?? "proxy",

  build: {
    command: "pnpm run build",
    outDir:  "dist",
  },

  routesFile: "staticRoutes",
}

export default config