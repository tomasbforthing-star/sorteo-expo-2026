import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const lotteries = await prisma.lottery.findMany({
      orderBy: { drawnAt: "desc" },
      include: {
        drawnByUser: { select: { name: true, email: true } },
        results: {
          orderBy: { position: "asc" },
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                instagram: true,
                phone: true,
                jornada: { select: { name: true } },
                promotora: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lotteries: lotteries.map((l) => ({
        id: l.id,
        title: l.title,
        totalEligible: l.totalEligible,
        winnersCount: l.winnersCount,
        alternatesCount: l.alternatesCount,
        drawnAt: l.drawnAt,
        drawnByName: l.drawnByUser?.name || "Administrador",
        results: l.results.map((r) => ({
          position: r.position,
          type: r.type,
          fullName: r.participant.fullName,
          instagram: r.participant.instagram,
          phone: r.participant.phone || "N/A",
          jornadaName: r.participant.jornada.name,
          promotoraName: r.participant.promotora?.name || "Registro Online / Web",
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching lotteries:", error);
    return NextResponse.json(
      { error: "Error al obtener historial de sorteos." },
      { status: 500 }
    );
  }
}
