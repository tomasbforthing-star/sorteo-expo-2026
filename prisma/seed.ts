import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("🌱 Iniciando seed de base de datos...");

  // 1. Limpiar base existente (orden inverso de dependencias)
  await prisma.lotteryResult.deleteMany();
  await prisma.lottery.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.jornada.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // 2. Configuración inicial
  await prisma.systemConfig.create({
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

  // 3. Crear Usuarios
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const promotoraPassword = await bcrypt.hash("Promotora123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@expchina.local",
      passwordHash: adminPassword,
      name: "Administrador General",
      role: "ADMIN",
      isActive: true,
    },
  });

  const promotoraDemo = await prisma.user.create({
    data: {
      email: "promotora@expchina.local",
      passwordHash: promotoraPassword,
      name: "Promotora Demo",
      role: "PROMOTORA",
      isActive: true,
    },
  });

  const maria = await prisma.user.create({
    data: {
      email: "maria@expchina.local",
      passwordHash: promotoraPassword,
      name: "María González",
      role: "PROMOTORA",
      isActive: true,
    },
  });

  const lucia = await prisma.user.create({
    data: {
      email: "lucia@expchina.local",
      passwordHash: promotoraPassword,
      name: "Lucía Fernández",
      role: "PROMOTORA",
      isActive: true,
    },
  });

  const carolina = await prisma.user.create({
    data: {
      email: "carolina@expchina.local",
      passwordHash: promotoraPassword,
      name: "Carolina Benítez",
      role: "PROMOTORA",
      isActive: true,
    },
  });

  // 4. Crear Jornadas
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const dia1 = await prisma.jornada.create({
    data: {
      number: 1,
      name: "DÍA 1",
      status: "CERRADA",
      openedAt: new Date(twoDaysAgo.setHours(9, 0, 0, 0)),
      closedAt: new Date(twoDaysAgo.setHours(19, 30, 0, 0)),
      closedByAdminId: admin.id,
    },
  });

  const dia2 = await prisma.jornada.create({
    data: {
      number: 2,
      name: "DÍA 2",
      status: "CERRADA",
      openedAt: new Date(yesterday.setHours(9, 0, 0, 0)),
      closedAt: new Date(yesterday.setHours(20, 0, 0, 0)),
      closedByAdminId: admin.id,
    },
  });

  const dia3 = await prisma.jornada.create({
    data: {
      number: 3,
      name: "DÍA 3",
      status: "ABIERTA",
      openedAt: new Date(now.setHours(9, 0, 0, 0)),
    },
  });

  // 5. Participantes Demo de Prueba
  const promotoras = [promotoraDemo, maria, lucia, carolina];

  const demoParticipantsData = [
    // Día 1 (Cerrada -> Habilitados en Base Master)
    { fullName: "Carlos Rodriguez", ig: "carlosrodriguez_ok", phone: "+54 9 11 4455-8899", jId: dia1.id, pId: maria.id },
    { fullName: "Valentina Rossi", ig: "valenrossi", phone: "+54 9 11 5566-7788", jId: dia1.id, pId: lucia.id },
    { fullName: "Martín Palermo", ig: "martinpalermo_9", phone: "1123456789", jId: dia1.id, pId: carolina.id },
    { fullName: "Sofia Martinez", ig: "sofimartinez_tv", phone: "+54 9 11 9988-1122", jId: dia1.id, pId: promotoraDemo.id },
    { fullName: "Lucas Gomez", ig: "lucasgomez_ar", phone: "011-4567-8901", jId: dia1.id, pId: maria.id },
    { fullName: "Camila Torres", ig: "camitorres", phone: "+54 11 6789-0123", jId: dia1.id, pId: lucia.id },
    { fullName: "Esteban Quito", ig: "estebanquito_real", phone: "1155443322", jId: dia1.id, pId: carolina.id },
    { fullName: "Agustina Paz", ig: "agustinapaz", phone: "+54 9 11 3322-1100", jId: dia1.id, pId: maria.id },
    { fullName: "Federico Alvarez", ig: "fedealvarez_ok", phone: "1166778899", jId: dia1.id, pId: lucia.id },
    { fullName: "Mariana Lopez", ig: "marianalopez", phone: "+54 9 11 7788-9900", jId: dia1.id, pId: carolina.id },

    // Día 2 (Cerrada -> Habilitados en Base Master)
    { fullName: "Gonzalo Higuain", ig: "gonzalohiguain", phone: "1122334455", jId: dia2.id, pId: maria.id },
    { fullName: "Florencia Peña", ig: "flor_pena_ok", phone: "+54 9 11 3456-7890", jId: dia2.id, pId: lucia.id },
    { fullName: "Julian Alvarez", ig: "julianalvarez_spider", phone: "1178901234", jId: dia2.id, pId: carolina.id },
    { fullName: "Luciana Salazar", ig: "lulipop_oficial", phone: "+54 9 11 8901-2345", jId: dia2.id, pId: promotoraDemo.id },
    { fullName: "Emiliano Martinez", ig: "dibumartinez_23", phone: "1190123456", jId: dia2.id, pId: maria.id },
    { fullName: "Micaela Viciconte", ig: "micaviciconte", phone: "+54 9 11 0123-4567", jId: dia2.id, pId: lucia.id },
    { fullName: "Rodrigo De Paul", ig: "rodridepaul", phone: "1133445566", jId: dia2.id, pId: carolina.id },
    { fullName: "Antonela Roccuzzo", ig: "antonelaroccuzzo", phone: "+54 9 11 4455-6677", jId: dia2.id, pId: maria.id },

    // Día 3 (Abierta -> En captación activa)
    { fullName: "Lautaro Martinez", ig: "lautaromartinez", phone: "+54 9 11 5566-7788", jId: dia3.id, pId: promotoraDemo.id },
    { fullName: "Enzo Fernandez", ig: "enzojfernandez", phone: "1166778899", jId: dia3.id, pId: maria.id },
    { fullName: "Alexis Mac Allister", ig: "alemacallister", phone: "+54 9 11 7788-9900", jId: dia3.id, pId: lucia.id },
    { fullName: "Nahuel Molina", ig: "nahuelmolina", phone: "1188990011", jId: dia3.id, pId: carolina.id },
  ];

  for (const p of demoParticipantsData) {
    await prisma.participant.create({
      data: {
        fullName: p.fullName,
        instagram: p.ig.toLowerCase().trim(),
        phone: p.phone,
        followsInstagram: true,
        promotoraId: p.pId,
        jornadaId: p.jId,
      },
    });
  }

  // 6. Auditoría de inicio
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userEmail: admin.email,
      action: "DEMO_RESET",
      entity: "Database",
      entityId: "SYSTEM",
      details: JSON.stringify({
        message: "Escenario DEMO inicializado exitosamente para EXPO CHINA 2026",
        jornadas: 3,
        participantes: demoParticipantsData.length,
      }),
    },
  });

  console.log("✅ Seed completado exitosamente con usuarios, jornadas y participantes demo.");
}

seedDatabase()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
