import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const jornadaNumber = searchParams.get("jornadaNumber");
    const exportCsv = searchParams.get("export") === "csv";

    // Base master: Solo jornadas con status "CERRADA"
    const where: any = {
      jornada: {
        status: "CERRADA",
      },
    };

    if (jornadaNumber && jornadaNumber !== "all") {
      where.jornada.number = parseInt(jornadaNumber, 10);
    }

    const participants = await prisma.participant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        promotora: { select: { name: true, email: true } },
        jornada: { select: { number: true, name: true } },
      },
    });

    const totalEligible = await prisma.participant.count({
      where: {
        jornada: { status: "CERRADA" },
      },
    });

    if (exportCsv) {
      // Formato CSV con BOM para compatibilidad con Excel en español
      const BOM = "\uFEFF";
      const headers = [
        "Nombre Completo",
        "Instagram",
        "Celular",
        "Promotora",
        "Jornada",
        "Fecha",
        "Hora",
      ];

      const rows = participants.map((p) => [
        `"${p.fullName.replace(/"/g, '""')}"`,
        `"${p.instagram}"`,
        `"${p.phone.replace(/"/g, '""')}"`,
        `"${p.promotora.name.replace(/"/g, '""')}"`,
        `"${p.jornada.name}"`,
        `"${formatDate(p.createdAt)}"`,
        `"${formatTime(p.createdAt)}"`,
      ]);

      const csvContent =
        BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="base_master_expo_china_${
            jornadaNumber && jornadaNumber !== "all" ? `dia_${jornadaNumber}` : "todos"
          }.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalEligible,
      currentFilterTotal: participants.length,
      participants: participants.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        instagram: p.instagram,
        phone: p.phone,
        promotoraName: p.promotora.name,
        jornadaName: p.jornada.name,
        jornadaNumber: p.jornada.number,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching base master:", error);
    return NextResponse.json(
      { error: "Error al consultar la Base Master." },
      { status: 500 }
    );
  }
}
