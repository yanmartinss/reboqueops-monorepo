import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

// Carrega o .env da pasta anterior (projeto-monorepo)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
