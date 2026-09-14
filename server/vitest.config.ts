import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // fileParallelism: false runs test files sequentially against the shared PostgreSQL database container.
    // This eliminates inter-suite database race conditions (e.g. concurrent User mutations, token revocations,
    // and ticket seed state conflicts) without requiring dynamic per-worker database isolation.
    fileParallelism: false,
  },
});
