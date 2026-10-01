import { NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (user) {
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: "LOGOUT",
        entity: "User",
        entityId: user.userId,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
