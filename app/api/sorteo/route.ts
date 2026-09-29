import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import crypto from "crypto";

// Algoritmo Fisher-Yates criptográficamente seguro
function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET() {
  try {
    const config = (await prisma.systemConfig.findUnique({
      where: { id: "default" },
    })) || {
      eventName: "EXPO CHINA 2026",
      lotteryName: "SORTEO MAR DE LAS PAMPAS",
      winnersCount: 3,
      alternatesCount: 7,
      excludePreviousWinners: true,
    };

    // Obtener ganadores anteriores si está activada la exclusión
    let excludedParticipantIds: string[] = [];
    if (config.excludePreviousWinners) {
      const pastWinners = await prisma.lotteryResult.findMany({
        where: { type: "WINNER" },
        select: { participantId: true },
      });
      excludedParticipantIds = pastWinners.map((w) => w.participantId);
    }

    // Participantes de jornadas cerradas
    const eligibleCount = await prisma.participant.count({
      where: {
        jornada: { status: "CERRADA" },
        id: { notIn: excludedParticipantIds },
      },
    });

    const closedJornadas = await prisma.jornada.findMany({
      where: { status: "CERRADA" },
      select: { name: true, number: true },
      orderBy: { number: "asc" },
    });

    // Último sorteo realizado
    const lastLottery = await prisma.lottery.findFirst({
      orderBy: { drawnAt: "desc" },
      include: {
        results: {
          include: {
            participant: {
              select: { id: true, fullName: true, instagram: true },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      eligibleCount,
      closedJornadas: closedJornadas.map((j) => j.name),
      config: {
        eventName: config.eventName,
        lotteryName: config.lotteryName,
        winnersCount: config.winnersCount,
        alternatesCount: config.alternatesCount,
        excludePreviousWinners: config.excludePreviousWinners,
      },
      lastLottery: lastLottery
        ? {
            id: lastLottery.id,
            title: lastLottery.title,
            drawnAt: lastLottery.drawnAt,
            winners: lastLottery.results
              .filter((r) => r.type === "WINNER")
              .map((r) => ({
                position: r.position,
                fullName: r.participant.fullName,
                instagram: r.participant.instagram,
              })),
            alternates: lastLottery.results
              .filter((r) => r.type === "ALTERNATE")
              .map((r) => ({
                position: r.position,
                fullName: r.participant.fullName,
                instagram: r.participant.instagram,
              })),
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting lottery status:", error);
    return NextResponse.json(
      { error: "Error al consultar estado del sorteo." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acción no autorizada. Requiere permisos de administrador." },
        { status: 403 }
      );
    }

    const config = (await prisma.systemConfig.findUnique({
      where: { id: "default" },
    })) || {
      lotteryName: "SORTEO MAR DE LAS PAMPAS",
      winnersCount: 3,
      alternatesCount: 7,
      excludePreviousWinners: true,
    };

    const winnersCount = config.winnersCount || 3;
    const alternatesCount = config.alternatesCount || 7;
    const totalRequired = winnersCount + alternatesCount;

    // Obtener participantes excluidos
    let excludedParticipantIds: string[] = [];
    if (config.excludePreviousWinners) {
      const pastWinners = await prisma.lotteryResult.findMany({
        where: { type: "WINNER" },
        select: { participantId: true },
      });
      excludedParticipantIds = pastWinners.map((w) => w.participantId);
    }

    // Universo de participantes habilitados de jornadas cerradas
    const eligibleParticipants = await prisma.participant.findMany({
      where: {
        jornada: { status: "CERRADA" },
        id: { notIn: excludedParticipantIds },
      },
      select: {
        id: true,
        fullName: true,
        instagram: true,
      },
    });

    if (eligibleParticipants.length < totalRequired) {
      return NextResponse.json(
        {
          error: `No hay suficientes participantes habilitados en jornadas cerradas para realizar el sorteo. Se requieren al menos ${totalRequired} participantes y hay ${eligibleParticipants.length}.`,
        },
        { status: 400 }
      );
    }

    // Ejecución segura del sorteo aleatorio
    const shuffled = secureShuffle(eligibleParticipants);
    const selectedWinners = shuffled.slice(0, winnersCount);
    const selectedAlternates = shuffled.slice(
      winnersCount,
      winnersCount + alternatesCount
    );

    // Guardar registro en Base de Datos de manera transaccional
    const lottery = await prisma.$transaction(async (tx) => {
      const createdLottery = await tx.lottery.create({
        data: {
          title: config.lotteryName,
          totalEligible: eligibleParticipants.length,
          winnersCount,
          alternatesCount,
          drawnByUserId: user.userId,
        },
      });

      // Crear resultados para Ganadores
      for (let i = 0; i < selectedWinners.length; i++) {
        await tx.lotteryResult.create({
          data: {
            lotteryId: createdLottery.id,
            participantId: selectedWinners[i].id,
            position: i + 1,
            type: "WINNER",
          },
        });
        await tx.participant.update({
          where: { id: selectedWinners[i].id },
          data: { status: "GANADOR" },
        });
      }

      // Crear resultados para Suplentes
      for (let i = 0; i < selectedAlternates.length; i++) {
        await tx.lotteryResult.create({
          data: {
            lotteryId: createdLottery.id,
            participantId: selectedAlternates[i].id,
            position: winnersCount + i + 1,
            type: "ALTERNATE",
          },
        });
        await tx.participant.update({
          where: { id: selectedAlternates[i].id },
          data: { status: "SUPLENTE" },
        });
      }

      return createdLottery;
    });

    // Registrar en auditoría
    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "SORTEO_CREATED",
      entity: "Lottery",
      entityId: lottery.id,
      details: {
        totalEligible: eligibleParticipants.length,
        winners: selectedWinners.map((w, idx) => ({
          pos: idx + 1,
          ig: w.instagram,
          name: w.fullName,
        })),
        alternates: selectedAlternates.map((a, idx) => ({
          pos: winnersCount + idx + 1,
          ig: a.instagram,
          name: a.fullName,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      lotteryId: lottery.id,
      drawnAt: lottery.drawnAt,
      totalEligible: eligibleParticipants.length,
      winners: selectedWinners.map((w, index) => ({
        position: index + 1,
        fullName: w.fullName,
        instagram: w.instagram,
      })),
      alternates: selectedAlternates.map((a, index) => ({
        position: winnersCount + index + 1,
        fullName: a.fullName,
        instagram: a.instagram,
      })),
    });
  } catch (error) {
    console.error("Error executing lottery:", error);
    return NextResponse.json(
      { error: "Error durante la ejecución del sorteo." },
      { status: 500 }
    );
  }
}
