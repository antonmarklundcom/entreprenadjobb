import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma ORM 7 has no built-in connection engine — a driver adapter is
// mandatory. `pg` over TCP works against Neon's pooled connection string,
// which is required at runtime because Hostinger's IPv6 routing to Neon's
// direct endpoint is broken. See .env.example for DATABASE_URL vs DIRECT_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
