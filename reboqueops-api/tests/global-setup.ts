import { execSync } from "node:child_process";

export default function setup() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !new URL(dbUrl).pathname.endsWith("_test")) {
    throw new Error("Tests just works on dbs when name finish with _test");
  }

  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
