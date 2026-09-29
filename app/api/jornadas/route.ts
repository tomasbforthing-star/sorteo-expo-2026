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
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acción reservada exclusivamente para administradores." },
        { status: 403 }
      );
    }

    const { jornadaId, action } = await req.json(); // action: "OPEN" | "CLOSE"

    if (!jornadaId || !action) {
      return NextResponse.json(
        { error: "Parámetros incompletos." },
        { status: 400 }
      );
    }

    const jornada = await prisma.jornada.findUnique({
      where: { id: jornadaId },
      include: { _count: { select: { participants: true } } },
    });

    if (!jornada) {
      return NextResponse.json(
        { error: "Jornada no encontrada." },
        { status: 404 }
      );
    }

    if (action === "CLOSE") {
      if (jornada.status === "CERRADA") {
        return NextResponse.json(
          { error: "Esta jornada ya fue cerrada." },
          { status: 400 }
        );
      }

      const updated = await prisma.jornada.update({
        where: { id: jornadaId },
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

    if (action === "OPEN") {
      // Verificar si hay otra jornada abierta y cerrarla o advertir
      const otherOpen = await prisma.jornada.findFirst({
        where: { status: "ABIERTA", id: { not: jornadaId } },
      });

      if (otherOpen) {
        return NextResponse.json(
          {
            error: `Ya existe una jornada abierta (${otherOpen.name}). Ciérrela antes de abrir otra.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.jornada.update({
        where: { id: jornadaId },
        data: {
          status: "ABIERTA",
          openedAt: jornada.openedAt || new Date(),
        },
      });

      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: "JORNADA_OPENED",
        entity: "Jornada",
        entityId: jornada.id,
        details: {
          jornadaName: jornada.name,
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
