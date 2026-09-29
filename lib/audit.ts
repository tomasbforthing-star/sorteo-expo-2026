import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  userId,
  userEmail,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
}) {
  try {
    const detailsString =
      typeof details === "object" && details !== null
        ? JSON.stringify(details)
        : details || null;

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userEmail: userEmail || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsString,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}
