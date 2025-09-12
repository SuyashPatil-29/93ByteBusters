import { PrismaClient } from "./generated/prisma";

// Ensure a usable default SQLite database if not provided via env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

let ensurePromise: Promise<void> | null = null;

export async function ensureDb(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        // Create tables if they do not exist (SQLite)
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "Location" (\n' +
            '  "id" INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '  "name" TEXT NOT NULL,\n' +
            '  "type" TEXT NOT NULL,\n' +
            '  "uuid" TEXT NOT NULL UNIQUE,\n' +
            '  "parentId" INTEGER,\n' +
            '  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
            '  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
            '  FOREIGN KEY("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE\n' +
          ')'
        );
        await prisma.$executeRawUnsafe(
          'CREATE INDEX IF NOT EXISTS "Location_name_type_idx" ON "Location"("name","type")'
        );

        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "ScrapeCache" (\n' +
            '  "id" INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '  "url" TEXT NOT NULL UNIQUE,\n' +
            '  "contentHtml" TEXT,\n' +
            '  "contentMd" TEXT,\n' +
            '  "lastFetched" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
            '  "ttlSeconds" INTEGER NOT NULL DEFAULT 21600\n' +
          ')'
        );
        await prisma.$executeRawUnsafe(
          'CREATE INDEX IF NOT EXISTS "ScrapeCache_lastFetched_idx" ON "ScrapeCache"("lastFetched")'
        );

        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "AuditLog" (\n' +
            '  "id" INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n' +
            '  "action" TEXT NOT NULL,\n' +
            '  "details" TEXT,\n' +
            '  "userHint" TEXT\n' +
          ')'
        );
      } catch {
        // Best-effort bootstrap; ignore if running in environments without SQLite permissions
      }
    })();
  }
  return ensurePromise;
}


