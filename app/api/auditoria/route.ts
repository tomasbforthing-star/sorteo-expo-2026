import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (action && action !== "ALL") {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userEmail: log.userEmail || log.user?.email || "Sistema",
        userName: log.user?.name || "Sistema Automático",
        details: log.details,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Error al obtener registros de auditoría." },
      { status: 500 }
    );
  }
}
