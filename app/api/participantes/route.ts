import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

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
      where.jornada = { number: parseInt(dayNumber, 10) };
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
        phone: p.phone,
        status: p.status,
        promotoraName: p.promotora.name,
        promotoraEmail: p.promotora.email,
        jornadaName: p.jornada.name,
        jornadaNumber: p.jornada.number,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
