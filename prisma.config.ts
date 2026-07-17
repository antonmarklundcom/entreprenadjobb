// Used by the Prisma CLI only (migrate/generate/studio/seed) — never by the
// running app. Run these commands LOCALLY on Windows, never on Hostinger.
// DIRECT_URL must be Neon's *direct* (non-pooled) connection string; the
// pgbouncer pooled string can break `prisma migrate`'s use of advisory locks
// and prepared statements.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
