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

    // 3. Conteos por Día y Web
    const [day1Count, day2Count, day3Count, webCount] = await Promise.all([
      prisma.participant.count({
        where: { jornada: { number: 1 }, promotoraId: { not: null } },
      }),
      prisma.participant.count({
        where: { jornada: { number: 2 }, promotoraId: { not: null } },
      }),
      prisma.participant.count({
        where: { jornada: { number: 3 }, promotoraId: { not: null } },
      }),
      prisma.participant.count({
        where: { promotoraId: null },
      }),
    ]);

    const jornadas = await prisma.jornada.findMany({
      orderBy: { number: "asc" },
      include: {
        _count: { select: { participants: true } },
      },
    });

    // 4. Jornada activa
    const activeJornada = jornadas.find((j) => j.status === "ABIERTA") || null;

    return NextResponse.json({
      success: true,
      stats: {
        totalParticipants,
        participantsToday,
        day1Count,
        day2Count,
        day3Count,
        webCount,
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
