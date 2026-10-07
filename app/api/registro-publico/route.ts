import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeInstagram } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

// GET: Returns public lottery event info and status
export async function GET() {
  try {
    const config = (await prisma.systemConfig.findUnique({
      where: { id: "default" },
    })) || {
      eventName: "EXPO CHINA 2026",
      lotteryName: "SORTEO MAR DE LAS PAMPAS",
      officialInstagram: "forthing.argentina",
    };

    const totalRegistered = await prisma.participant.count();

    return NextResponse.json({
      success: true,
      eventName: config.eventName,
      lotteryName: config.lotteryName,
      officialInstagram: config.officialInstagram,
      totalRegistered,
    });
  } catch (error) {
    console.error("Error fetching public info:", error);
    return NextResponse.json(
      { error: "Error al cargar información del evento." },
      { status: 500 }
    );
  }
}

// POST: Public participant registration (Name & Instagram only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, instagram } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 3) {
      return NextResponse.json(
        { error: "Por favor, ingresá tu Nombre y Apellido completo (mínimo 3 caracteres)." },
        { status: 400 }
      );
    }

    if (!instagram || typeof instagram !== "string" || instagram.trim().length === 0) {
      return NextResponse.json(
        { error: "Por favor, ingresá tu usuario de Instagram." },
        { status: 400 }
      );
    }

    // 2. Normalize Instagram handle
    const cleanInstagram = normalizeInstagram(instagram);
    if (!cleanInstagram || cleanInstagram.length < 2) {
      return NextResponse.json(
        { error: "Por favor, ingresá un usuario de Instagram válido." },
        { status: 400 }
      );
    }

    // 3. Duplicate check
    const existing = await prisma.participant.findUnique({
      where: { instagram: cleanInstagram },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `¡El usuario de Instagram @${cleanInstagram} ya se encuentra registrado en el sorteo!`,
        },
        { status: 409 }
      );
    }

    // 4. Determine target jornada
    // Priority: 1) currently open jornada, 2) first pending jornada, 3) first available jornada
    let targetJornada = await prisma.jornada.findFirst({
      where: { status: "ABIERTA" },
      orderBy: { number: "asc" },
    });

    if (!targetJornada) {
      targetJornada = await prisma.jornada.findFirst({
        where: { status: "PENDIENTE" },
        orderBy: { number: "asc" },
      });
    }

    if (!targetJornada) {
      targetJornada = await prisma.jornada.findFirst({
        orderBy: { number: "asc" },
      });
    }

    // Fallback: If no jornada exists at all, create Day 1
    if (!targetJornada) {
      targetJornada = await prisma.jornada.create({
        data: {
          number: 1,
          name: "DÍA 1",
          status: "ABIERTA",
          openedAt: new Date(),
        },
      });
    }

    // 5. Create participant in database
    const newParticipant = await prisma.participant.create({
      data: {
        fullName: fullName.trim(),
        instagram: cleanInstagram,
        phone: "", // No phone required for public web registrations
        followsInstagram: true,
        jornadaId: targetJornada.id,
      },
      include: {
        jornada: true,
      },
    });

    // 6. Audit Trail for public registration
    await createAuditLog({
      userId: null,
      userEmail: "publico@expo.local",
      action: "PARTICIPANTE_PUBLICO_CREADO",
      entity: "Participant",
      entityId: newParticipant.id,
      details: {
        fullName: newParticipant.fullName,
        instagram: newParticipant.instagram,
        jornada: targetJornada.name,
        source: "WEB_PUBLICA",
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡Felicitaciones ${newParticipant.fullName}! Ya estás registrado para el sorteo.`,
      participant: {
        id: newParticipant.id,
        fullName: newParticipant.fullName,
        instagram: newParticipant.instagram,
        jornadaName: targetJornada.name,
        createdAt: newParticipant.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in public registration:", error);
    return NextResponse.json(
      { error: "Se produjo un error al procesar tu inscripción. Por favor, volvé a intentar." },
      { status: 500 }
    );
  }
}
