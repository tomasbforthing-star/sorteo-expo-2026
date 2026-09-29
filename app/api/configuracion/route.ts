import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { seedDatabase } from "@/prisma/seed";

export async function GET() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: "default",
          eventName: "EXPO CHINA 2026",
          lotteryName: "SORTEO MAR DE LAS PAMPAS",
          officialInstagram: "forthing.argentina",
          totalDays: 3,
          winnersCount: 3,
          alternatesCount: 7,
          excludePreviousWinners: true,
        },
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const {
      eventName,
      lotteryName,
      officialInstagram,
      totalDays,
      winnersCount,
      alternatesCount,
      excludePreviousWinners,
    } = body;

    const updated = await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        eventName: eventName || undefined,
        lotteryName: lotteryName || undefined,
        officialInstagram: officialInstagram || undefined,
        totalDays: totalDays !== undefined ? Number(totalDays) : undefined,
        winnersCount: winnersCount !== undefined ? Number(winnersCount) : undefined,
        alternatesCount:
          alternatesCount !== undefined ? Number(alternatesCount) : undefined,
        excludePreviousWinners:
          excludePreviousWinners !== undefined
            ? Boolean(excludePreviousWinners)
            : undefined,
      },
      create: {
        id: "default",
        eventName: eventName || "EXPO CHINA 2026",
        lotteryName: lotteryName || "SORTEO MAR DE LAS PAMPAS",
        officialInstagram: officialInstagram || "forthing.argentina",
        totalDays: totalDays ? Number(totalDays) : 3,
        winnersCount: winnersCount ? Number(winnersCount) : 3,
        alternatesCount: alternatesCount ? Number(alternatesCount) : 7,
        excludePreviousWinners:
          excludePreviousWinners !== undefined
            ? Boolean(excludePreviousWinners)
            : true,
      },
    });

    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "CONFIG_UPDATED",
      entity: "SystemConfig",
      entityId: "default",
      details: updated,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === "RESET_DEMO") {
      await seedDatabase();

      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: "DEMO_RESET",
        entity: "Database",
        entityId: "SYSTEM",
        details: { resetBy: user.email, timestamp: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "Escenario DEMO restaurado exitosamente a su estado inicial.",
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    console.error("Error resetting demo data:", error);
    return NextResponse.json(
      { error: "Error al reiniciar datos demo." },
      { status: 500 }
    );
  }
}
