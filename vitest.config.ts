import path from "node:path";
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Tests load .env.test only. There is no fallback to .env: the suite
// truncates every table, and tests/setup.ts additionally refuses any
// database whose name does not end in "_test".
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    // Tests share one Postgres database, so runs must be serialized.
    fileParallelism: false,
    maxWorkers: 1,
    pool: "forks",
  },
});
