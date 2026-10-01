import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET: List all users
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Administrador." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        plainPassword: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        plainPassword: u.plainPassword || "••••••••",
        participantsCount: u._count.participants,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener lista de usuarios." },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Administrador." },
        { status: 403 }
      );
    }

    const { name, email, password, role, isActive } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ingrese un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.trim().length < 4) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un usuario registrado con el email ${normalizedEmail}.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password.trim());
    const validRole = ["ADMIN", "PROMOTORA", "REPRESENTANTE"].includes(role) ? role : "PROMOTORA";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        plainPassword: password.trim(),
        role: validRole,
        isActive: isActive !== false,
      },
    });

    await createAuditLog({
      userId: currentUser.userId,
      userEmail: currentUser.email,
      action: "USER_CREATED",
      entity: "User",
      entityId: newUser.id,
      details: {
        createdUserName: newUser.name,
        createdUserEmail: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${newUser.name} creado exitosamente.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        plainPassword: newUser.plainPassword,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario." },
      { status: 500 }
    );
  }
}

// PUT: Modify an existing user (or change password)
export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Administrador." },
        { status: 403 }
      );
    }

    const { id, name, email, role, isActive, password } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario no especificado." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (name && typeof name === "string") {
      dataToUpdate.name = name.trim();
    }

    if (email && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { error: `El email ${normalizedEmail} ya está en uso por otro usuario.` },
            { status: 409 }
          );
        }
        dataToUpdate.email = normalizedEmail;
      }
    }

    if (role && ["ADMIN", "PROMOTORA", "REPRESENTANTE"].includes(role)) {
      dataToUpdate.role = role;
    }

    if (typeof isActive === "boolean") {
      dataToUpdate.isActive = isActive;
    }

    let passwordChanged = false;
    if (password && typeof password === "string" && password.trim().length >= 4) {
      dataToUpdate.passwordHash = await hashPassword(password.trim());
      dataToUpdate.plainPassword = password.trim();
      passwordChanged = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    await createAuditLog({
      userId: currentUser.userId,
      userEmail: currentUser.email,
      action: passwordChanged ? "USER_PASSWORD_CHANGED" : "USER_UPDATED",
      entity: "User",
      entityId: updatedUser.id,
      details: {
        targetUserName: updatedUser.name,
        targetUserEmail: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        passwordModified: passwordChanged,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${updatedUser.name} actualizado exitosamente.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        plainPassword: updatedUser.plainPassword,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Administrador." },
        { status: 403 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario no especificado." },
        { status: 400 }
      );
    }

    if (id === currentUser.userId) {
      return NextResponse.json(
        { error: "No puede eliminar su propia cuenta de Administrador mientras está en sesión." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "El usuario no existe o ya fue eliminado." },
        { status: 404 }
      );
    }

    // Si tiene participantes vinculados, reasignarlos o borrar de forma segura
    // Para no romper integridad referencial, actualizamos closedBy o participantes
    await prisma.$transaction(async (tx) => {
      // Desvincular de jornadas cerradas
      await tx.jornada.updateMany({
        where: { closedByAdminId: id },
        data: { closedByAdminId: null },
      });

      // Desvincular de sorteos ejecutados
      await tx.lottery.updateMany({
        where: { drawnByUserId: id },
        data: { drawnByUserId: null },
      });

      // Si tiene participantes cargados, reasignarlos al admin que elimina
      if (targetUser._count.participants > 0) {
        await tx.participant.updateMany({
          where: { promotoraId: id },
          data: { promotoraId: currentUser.userId },
        });
      }

      // Eliminar el usuario
      await tx.user.delete({
        where: { id },
      });
    });

    await createAuditLog({
      userId: currentUser.userId,
      userEmail: currentUser.email,
      action: "USER_DELETED",
      entity: "User",
      entityId: id,
      details: {
        deletedUserName: targetUser.name,
        deletedUserEmail: targetUser.email,
        deletedUserRole: targetUser.role,
        participantsReassigned: targetUser._count.participants,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${targetUser.name} (${targetUser.email}) eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario." },
      { status: 500 }
    );
  }
}
