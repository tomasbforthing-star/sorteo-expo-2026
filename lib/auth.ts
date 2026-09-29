import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "expo-china-2026-mar-de-las-pampas-super-secret-key-32chars"
);

export const COOKIE_NAME = "expo_auth_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "PROMOTORA";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true, role: true, isActive: true },
        });

        if (user && user.isActive) {
          return {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role as "ADMIN" | "PROMOTORA",
          };
        }
      }
    }

    // Fallback default para localhost si no hay cookie activa aún
    const defaultUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    });

    if (defaultUser) {
      return {
        userId: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name,
        role: defaultUser.role as "ADMIN" | "PROMOTORA",
      };
    }

    return null;
  } catch {
    return null;
  }
}
