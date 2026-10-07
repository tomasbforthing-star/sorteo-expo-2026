import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const dayNumber = searchParams.get("dayNumber") || "";
    const jornadaId = searchParams.get("jornadaId") || "";
    const isExportAll = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = isExportAll ? 10000 : parseInt(searchParams.get("limit") || "20", 10);
    const skip = isExportAll ? 0 : (page - 1) * limit;

    const where: any = {};

    if (search) {
      const cleanSearch = search.replace(/^@/, "").toLowerCase();
      where.OR = [
        { fullName: { contains: search } },
        { instagram: { contains: cleanSearch } },
        { phone: { contains: search } },
      ];
    }

    if (dayNumber && dayNumber !== "all") {
      if (dayNumber === "web") {
        where.promotoraId = null;
      } else {
        where.jornada = { number: parseInt(dayNumber, 10) };
        where.promotoraId = { not: null };
      }
    } else if (jornadaId) {
      where.jornadaId = jornadaId;
    }

    const [total, participants] = await Promise.all([
      prisma.participant.count({ where }),
      prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          promotora: { select: { id: true, name: true, email: true } },
          jornada: { select: { id: true, name: true, number: true, status: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      participants: participants.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        instagram: p.instagram,
        phone: p.phone || "N/A",
        status: p.status,
        promotoraName: p.promotora?.name || "Registro Online / Web",
        promotoraEmail: p.promotora?.email || "publico@expo.local",
        jornadaName: p.jornada.name,
        jornadaNumber: p.jornada.number,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (isExportAll ? 10000 : limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Error al obtener participantes." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acción no autorizada. Solo los administradores pueden borrar participantes." },
        { status: 403 }
      );
    }

    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json(
        { error: "ID de participante no proporcionado." },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        jornada: true,
        promotora: { select: { name: true, email: true } },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "El participante no existe o ya fue eliminado." },
        { status: 404 }
      );
    }

    // Si tiene sorteos asociados, eliminar resultados previos
    await prisma.lotteryResult.deleteMany({
      where: { participantId },
    });

    // Eliminar participante
    await prisma.participant.delete({
      where: { id: participantId },
    });

    // Registro en auditoría
    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "PARTICIPANTE_DELETED",
      entity: "Participant",
      entityId: participant.id,
      details: {
        participantName: participant.fullName,
        instagram: participant.instagram,
        phone: participant.phone,
        jornada: participant.jornada?.name,
        cargadoPor: participant.promotora?.name || participant.promotora?.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Participante ${participant.fullName} (@${participant.instagram}) eliminado correctamente.`,
    });
  } catch (error) {
    console.error("Error deleting participant:", error);
    return NextResponse.json(
      { error: "Error al eliminar el participante." },
      { status: 500 }
    );
  }
}

