import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const promotoras = await prisma.user.findMany({
      where: { role: "PROMOTORA" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { participants: true },
        },
        participants: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      promotoras: promotoras.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        isActive: p.isActive,
        participantsCount: p._count.participants,
        lastActivity: p.participants[0]?.createdAt || null,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching promotoras:", error);
    return NextResponse.json(
      { error: "Error al obtener promotoras." },
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

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña inicial son obligatorios." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newPromotora = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "PROMOTORA",
        isActive: true,
      },
    });

    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "PROMOTORA_CREATED",
      entity: "User",
      entityId: newPromotora.id,
      details: { name: newPromotora.name, email: newPromotora.email },
    });

    return NextResponse.json({
      success: true,
      promotora: {
        id: newPromotora.id,
        name: newPromotora.name,
        email: newPromotora.email,
        isActive: newPromotora.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating promotora:", error);
    return NextResponse.json(
      { error: "Error al crear la promotora." },
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

    const { id, isActive } = await req.json();

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Datos de solicitud inválidos." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: isActive ? "PROMOTORA_ENABLED" : "PROMOTORA_DISABLED",
      entity: "User",
      entityId: updated.id,
      details: { name: updated.name, email: updated.email, isActive },
    });

    return NextResponse.json({
      success: true,
      promotora: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating promotora:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de la promotora." },
      { status: 500 }
    );
  }
}
