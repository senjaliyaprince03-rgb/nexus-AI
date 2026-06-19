import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow explicit `any` in limited cases (API response types, test mocks)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars prefixed with _ (convention for intentionally unused)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Prefer const
      "prefer-const": "error",
      // No console.log in production code (use structlog on backend, remove on frontend)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
]

export default eslintConfig
