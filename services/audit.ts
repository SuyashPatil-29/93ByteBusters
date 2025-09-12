import { prisma, ensureDb } from "@/lib/prisma";

export async function logAudit(action: string, details?: any, userHint?: string) {
  try {
    await ensureDb();
    await prisma.auditLog.create({ data: { action, details, userHint } });
  } catch (e) {
    console.error("Audit log failed", e);
  }
}


