import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeInstagram } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      );
    }

    const { fullName, instagram, phone, followsInstagram, dayNumber } = await req.json();

    // 1. Validaciones básicas
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 3) {
      return NextResponse.json(
        { error: "El nombre completo es obligatorio y debe tener al menos 3 caracteres." },
        { status: 400 }
      );
    }

    if (!instagram || typeof instagram !== "string" || instagram.trim().length === 0) {
      return NextResponse.json(
        { error: "El usuario de Instagram es obligatorio." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json(
        { error: "El número de celular es obligatorio." },
        { status: 400 }
      );
    }

    if (!followsInstagram) {
      return NextResponse.json(
        { error: "Debe confirmar que el participante sigue la cuenta oficial de Instagram." },
        { status: 400 }
      );
    }

    // 2. Normalización de Instagram
    const cleanInstagram = normalizeInstagram(instagram);
    if (!cleanInstagram || cleanInstagram.length < 2) {
      return NextResponse.json(
        { error: "Ingrese un usuario de Instagram válido." },
        { status: 400 }
      );
    }

    // 3. Obtener todas las jornadas
    const jornadas = await prisma.jornada.findMany({
      orderBy: { number: "asc" },
    });

    const j1 = jornadas.find((j) => j.number === 1);
    const j2 = jornadas.find((j) => j.number === 2);
    const j3 = jornadas.find((j) => j.number === 3);

    const targetDayNumber = Number(dayNumber) || (jornadas.find((j) => j.status === "ABIERTA")?.number || 1);

    let targetJornada = jornadas.find((j) => j.number === targetDayNumber);
    if (!targetJornada) {
      return NextResponse.json(
        { error: `La jornada Día ${targetDayNumber} no existe.` },
        { status: 400 }
      );
    }

    // 4. Regla estricta de días: Para avanzar a Día 2 o Día 3, el día anterior debe estar CERRADO
    if (targetDayNumber === 1) {
      if (targetJornada.status === "CERRADA") {
        return NextResponse.json(
          { error: "El Día 1 ya se encuentra cerrado. Seleccione un día posterior habilitado." },
          { status: 400 }
        );
      }
      if (targetJornada.status === "PENDIENTE") {
        targetJornada = await prisma.jornada.update({
          where: { id: targetJornada.id },
          data: { status: "ABIERTA", openedAt: new Date() },
        });
      }
    } else if (targetDayNumber === 2) {
      if (j1?.status !== "CERRADA") {
        return NextResponse.json(
          { error: "Para cargar en el Día 2, primero debe cerrar las altas del Día 1." },
          { status: 400 }
        );
      }
      if (targetJornada.status === "CERRADA") {
        return NextResponse.json(
          { error: "El Día 2 ya se encuentra cerrado. Seleccione el Día 3 si está habilitado." },
          { status: 400 }
        );
      }
      if (targetJornada.status === "PENDIENTE") {
        targetJornada = await prisma.jornada.update({
          where: { id: targetJornada.id },
          data: { status: "ABIERTA", openedAt: new Date() },
        });
      }
    } else if (targetDayNumber === 3) {
      if (j2?.status !== "CERRADA") {
        return NextResponse.json(
          { error: "Para cargar en el Día 3, primero debe cerrar las altas del Día 2." },
          { status: 400 }
        );
      }
      if (targetJornada.status === "CERRADA") {
        return NextResponse.json(
          { error: "El Día 3 ya se encuentra cerrado." },
          { status: 400 }
        );
      }
      if (targetJornada.status === "PENDIENTE") {
        targetJornada = await prisma.jornada.update({
          where: { id: targetJornada.id },
          data: { status: "ABIERTA", openedAt: new Date() },
        });
      }
    }

    // 5. Verificación de Duplicados por Instagram
    const existing = await prisma.participant.findUnique({
      where: { instagram: cleanInstagram },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Este usuario de Instagram ya se encuentra registrado. Si considerás que se trata de un error, consultá con un administrador.",
        },
        { status: 409 }
      );
    }

    // 6. Crear Participante
    const participant = await prisma.participant.create({
      data: {
        fullName: fullName.trim(),
        instagram: cleanInstagram,
        phone: phone.trim(),
        followsInstagram: true,
        promotoraId: user.userId,
        jornadaId: targetJornada.id,
      },
      include: {
        jornada: true,
        promotora: {
          select: { name: true, email: true },
        },
      },
    });

    // 7. Auditoría
    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "PARTICIPANTE_CREATED",
      entity: "Participant",
      entityId: participant.id,
      details: {
        fullName: participant.fullName,
        instagram: participant.instagram,
        jornada: targetJornada.name,
      },
    });

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        instagram: participant.instagram,
        jornada: participant.jornada.name,
        jornadaNumber: participant.jornada.number,
        createdAt: participant.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating participant:", error);
    return NextResponse.json(
      { error: "Se produjo un error inesperado al registrar al participante." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const jornadas = await prisma.jornada.findMany({
      orderBy: { number: "asc" },
      include: {
        _count: { select: { participants: true } },
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
      })),
    });
  } catch (error) {
    console.error("Error fetching captacion info:", error);
    return NextResponse.json(
      { error: "Error al obtener información de jornadas." },
      { status: 500 }
    );
  }
}
