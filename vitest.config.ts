import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Placeholder DB vars so modules that import the Prisma client construct cleanly.
    env: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/obol",
      DIRECT_URL: "postgresql://user:pass@localhost:5432/obol",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
