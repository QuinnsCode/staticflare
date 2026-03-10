import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from "@cloudflare/vite-plugin";
import { staticflare } from "./lib/vite-plugin/index";

export default defineConfig({
  optimizeDeps: {
    exclude: ['rwsdk/use-synced-state/worker'],
  },
  environments: {
    ssr: {
      optimizeDeps: {
        exclude: ['rwsdk/use-synced-state/worker'],
      }
    },
    worker: {
      optimizeDeps: {
        exclude: ['rwsdk/use-synced-state/worker'],
      }
    },
  },
  plugins: [
    cloudflare({
      viteEnvironment: { name: "worker" },
    }),
    redwood(),
    tailwindcss(),
    staticflare(),  // ← always last
  ],
});