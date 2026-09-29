import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    // 1. Total Participantes
    const totalParticipants = await prisma.participant.count();

    // 2. Participantes hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const participantsToday = await prisma.participant.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // 3. Jornadas con conteos
    const jornadas = await prisma.jornada.findMany({
      orderBy: { number: "asc" },
      include: {
        _count: { select: { participants: true } },
      },
    });

    // 4. Jornada activa
    const activeJornada = jornadas.find((j) => j.status === "ABIERTA") || null;

    // Conteo por día
    const day1 = jornadas.find((j) => j.number === 1);
    const day2 = jornadas.find((j) => j.number === 2);
    const day3 = jornadas.find((j) => j.number === 3);

    return NextResponse.json({
      success: true,
      stats: {
        totalParticipants,
        participantsToday,
        day1Count: day1?._count.participants || 0,
        day2Count: day2?._count.participants || 0,
        day3Count: day3?._count.participants || 0,
        activeJornada: activeJornada
          ? {
              id: activeJornada.id,
              name: activeJornada.name,
              number: activeJornada.number,
              status: activeJornada.status,
              count: activeJornada._count.participants,
            }
          : null,
        jornadas: jornadas.map((j) => ({
          id: j.id,
          number: j.number,
          name: j.name,
          status: j.status,
          count: j._count.participants,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas." },
      { status: 500 }
    );
  }
}
