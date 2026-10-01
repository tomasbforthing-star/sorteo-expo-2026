import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const jornadas = await prisma.jornada.findMany({
      orderBy: { number: "asc" },
      include: {
        _count: {
          select: { participants: true },
        },
        closedByAdmin: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      jornadas: jornadas.map((j) => ({
        id: j.id,
        number: j.number,
        name: j.name,
        status: j.status,
        participantsCount: j._count.participants,
        openedAt: j.openedAt,
        closedAt: j.closedAt,
        closedByName: j.closedByAdmin?.name || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching jornadas:", error);
    return NextResponse.json(
      { error: "Error al obtener jornadas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      );
    }

    const { jornadaId, dayNumber, action } = await req.json(); // action: "OPEN" | "CLOSE" | "REOPEN"

    if (!action) {
      return NextResponse.json(
        { error: "Acción no especificada." },
        { status: 400 }
      );
    }

    // Buscar jornada por ID o por número de día
    let jornada = null;
    if (jornadaId) {
      jornada = await prisma.jornada.findUnique({
        where: { id: jornadaId },
        include: { _count: { select: { participants: true } } },
      });
    } else if (dayNumber) {
      jornada = await prisma.jornada.findFirst({
        where: { number: Number(dayNumber) },
        include: { _count: { select: { participants: true } } },
      });
    }

    if (!jornada) {
      return NextResponse.json(
        { error: "Jornada no encontrada." },
        { status: 404 }
      );
    }

    // --- ACCIÓN: CERRAR ALTAS (Permitido para ADMIN y PROMOTORA) ---
    if (action === "CLOSE") {
      if (jornada.status === "CERRADA") {
        return NextResponse.json(
          { error: `La jornada ${jornada.name} ya se encuentra cerrada.` },
          { status: 400 }
        );
      }

      const updated = await prisma.jornada.update({
        where: { id: jornada.id },
        data: {
          status: "CERRADA",
          closedAt: new Date(),
          closedByAdminId: user.userId,
        },
      });

      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: "JORNADA_CLOSED",
        entity: "Jornada",
        entityId: jornada.id,
        details: {
          jornadaName: jornada.name,
          participantesCaptados: jornada._count.participants,
          closedByRole: user.role,
          closedAt: updated.closedAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Jornada ${jornada.name} cerrada exitosamente.`,
        jornada: updated,
        count: jornada._count.participants,
      });
    }

    // --- ACCIÓN: ABRIR O REABRIR JORNADA (EXCLUSIVO ADMIN) ---
    if (action === "OPEN" || action === "REOPEN") {
      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Solo los usuarios administradores pueden abrir o reabrir jornadas." },
          { status: 403 }
        );
      }

      // Si hay otra jornada actualmente abierta, cerrarla automáticamente
      await prisma.jornada.updateMany({
        where: {
          status: "ABIERTA",
          id: { not: jornada.id },
        },
        data: {
          status: "CERRADA",
          closedAt: new Date(),
          closedByAdminId: user.userId,
        },
      });

      const updated = await prisma.jornada.update({
        where: { id: jornada.id },
        data: {
          status: "ABIERTA",
          openedAt: new Date(),
          closedAt: null,
        },
      });

      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: action === "REOPEN" ? "JORNADA_REOPENED" : "JORNADA_OPENED",
        entity: "Jornada",
        entityId: jornada.id,
        details: {
          jornadaName: jornada.name,
          action: action === "REOPEN" ? "Reapertura de jornada por administrador" : "Apertura de jornada por administrador",
          openedAt: updated.openedAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Jornada ${jornada.name} abierta exitosamente.`,
        jornada: updated,
      });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    console.error("Error managing jornada:", error);
    return NextResponse.json(
      { error: "Error al actualizar la jornada." },
      { status: 500 }
    );
  }
}

