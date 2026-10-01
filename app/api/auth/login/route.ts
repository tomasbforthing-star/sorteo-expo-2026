import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "El usuario se encuentra inactivo. Contacte al administrador." },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "PROMOTORA" | "REPRESENTANTE",
    });

    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      details: { role: user.role, name: user.name },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Se produjo un error inesperado al iniciar sesión." },
      { status: 500 }
    );
  }
}
