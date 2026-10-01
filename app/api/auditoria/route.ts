import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Requiere permisos de administrador." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const search = searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action && action !== "ALL") {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { userEmail: { contains: search } },
        { action: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [total, logs, counts] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      Promise.all([
        prisma.auditLog.count({ where: { action: "PARTICIPANTE_CREATED" } }),
        prisma.auditLog.count({ where: { action: "PARTICIPANTE_DELETED" } }),
        prisma.auditLog.count({ where: { action: "JORNADA_CLOSED" } }),
        prisma.auditLog.count({ where: { action: "SORTEO_CREATED" } }),
        prisma.auditLog.count({ where: { action: "LOGIN" } }),
      ]),
    ]);

    const [createdCount, deletedCount, closedCount, sorteoCount, loginCount] = counts;

    return NextResponse.json({
      success: true,
      metrics: {
        total,
        createdCount,
        deletedCount,
        closedCount,
        sorteoCount,
        loginCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userEmail: log.userEmail || log.user?.email || "Sistema",
        userName: log.user?.name || "Sistema",
        userRole: log.user?.role || "ADMIN",
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

