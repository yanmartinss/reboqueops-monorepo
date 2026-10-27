import { defineConfig } from "vitest/config";
import path from "node:path";

process.loadEnvFile(path.resolve(import.meta.dirname, "../.env.test"));

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
  },
});
