import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const configDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/**", "node_modules/**", "**/*.spec.ts", "**/*.spec.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", ".next/", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: { "@": resolve(configDir, "src") },
  },
})
