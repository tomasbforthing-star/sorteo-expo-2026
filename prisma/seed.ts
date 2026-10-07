import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("🌱 Iniciando seed de base de datos oficial...");

  // 1. Configuración del Sistema (Upsert)
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {
      eventName: "EXPO CHINA 2026",
      lotteryName: "SORTEO MAR DE LAS PAMPAS",
      officialInstagram: "forthingargentina",
      totalDays: 3,
      winnersCount: 3,
      alternatesCount: 7,
      excludePreviousWinners: true,
    },
    create: {
      id: "default",
      eventName: "EXPO CHINA 2026",
      lotteryName: "SORTEO MAR DE LAS PAMPAS",
      officialInstagram: "forthingargentina",
      totalDays: 3,
      winnersCount: 3,
      alternatesCount: 7,
      excludePreviousWinners: true,
    },
  });

  // 2. Usuarios oficiales
  const usersToCreate = [
    {
      email: "tomas.barcia@forthing.com.ar",
      name: "Tomás Barcia",
      password: "Tomas2626",
      role: "ADMIN",
    },
    {
      email: "luana.trunzo@forthing.com.ar",
      name: "Luana Trunzo",
      password: "Luana2626",
      role: "PROMOTORA",
    },
    {
      email: "sol.bruna@forthing.com.ar",
      name: "Sol Bruna",
      password: "Sol2626",
      role: "PROMOTORA",
    },
  ];

  for (const u of usersToCreate) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        name: u.name,
        passwordHash: passwordHash,
        plainPassword: u.password,
        role: u.role,
        isActive: true,
      },
      create: {
        email: u.email.toLowerCase().trim(),
        name: u.name,
        passwordHash: passwordHash,
        plainPassword: u.password,
        role: u.role,
        isActive: true,
      },
    });
    console.log(`👤 Usuario configurado: ${u.email} (${u.role})`);
  }

  // 3. Crear o verificar Jornadas (Día 1, Día 2, Día 3)
  const j1 = await prisma.jornada.findFirst({ where: { number: 1 } });
  if (!j1) {
    await prisma.jornada.create({
      data: {
        number: 1,
        name: "DÍA 1",
        status: "ABIERTA",
        openedAt: new Date(),
      },
    });
  }

  const j2 = await prisma.jornada.findFirst({ where: { number: 2 } });
  if (!j2) {
    await prisma.jornada.create({
      data: {
        number: 2,
        name: "DÍA 2",
        status: "PENDIENTE",
      },
    });
  }

  const j3 = await prisma.jornada.findFirst({ where: { number: 3 } });
  if (!j3) {
    await prisma.jornada.create({
      data: {
        number: 3,
        name: "DÍA 3",
        status: "PENDIENTE",
      },
    });
  }

  console.log("✅ Configuración inicial y usuarios de producción listos.");
}

seedDatabase()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

