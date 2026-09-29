# EXPO CHINA 2026 — SISTEMA DE CAPTACIÓN Y SORTEO
### Sorteo Oficial: Estadía en Mar de las Pampas | Forthing Argentina

Plataforma web integral, moderna y funcional construida con arquitectura **Next.js (App Router), TypeScript, Tailwind CSS, Prisma y SQLite** para la gestión de promotoras, captación masiva en tiempo real, administración de jornadas de exposición, consolidación de Base Master y sorteo público con pantalla cinemática para TV/Proyector.

---

## 🚀 Acceso Rápido & Credenciales DEMO

Una vez iniciado el servidor en `http://localhost:3000`:

| Rol | Correo Electrónico | Contraseña | Destino tras Login |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@expchina.local` | `Admin123!` | `/admin` (Panel General) |
| **PROMOTORA** | `promotora@expchina.local` | `Promotora123!` | `/captacion` (Captura Rápida) |
| **PROMOTORA 1** | `maria@expchina.local` | `Promotora123!` | `/captacion` |
| **PROMOTORA 2** | `lucia@expchina.local` | `Promotora123!` | `/captacion` |
| **PROMOTORA 3** | `carolina@expchina.local` | `Promotora123!` | `/captacion` |

---

## 🛠️ Instalación y Ejecución en Localhost

### Requisitos previos
- Node.js 18+ (o Node 20 / 24)
- npm 9+

### Pasos de ejecución
```bash
# 1. Instalar dependencias
npm install

# 2. Sincronizar base de datos local SQLite y generar cliente Prisma
npx prisma db push

# 3. Cargar datos demo iniciales (3 días, promotoras y participantes)
npm run seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará lista en: **[http://localhost:3000](http://localhost:3000)**

---

## 📱 Flujo de Prueba de Punta a Punta

1. **Ingreso de Promotora (`/login`)**:
   - Iniciar sesión con `promotora@expchina.local` / `Promotora123!`.
   - Se redirige automáticamente a `/captacion`.
2. **Registro de Participantes (`/captacion`)**:
   - Completar Nombre Completo, Usuario de Instagram (se normaliza sin `@`, minúsculas, sin espacios) y Celular.
   - Marcar el checkbox de seguimiento a la cuenta oficial `@forthing.argentina`.
   - Click en **REGISTRAR PARTICIPANTE**.
   - Aparece modal de confirmación `✓ PARTICIPANTE REGISTRADO` y el formulario se resetea automáticamente listo para el siguiente registro.
   - Probar ingresar el mismo Instagram (`@JuanPerez` y `juanperez`): el sistema bloqueará el duplicado con mensaje explicativo.
   - Ir a **Mis Registros** (`/mis-registros`) para ver los participantes captados por la promotora actual.
3. **Panel Administrativo (`/admin`)**:
   - Iniciar sesión con `admin@expchina.local` / `Admin123!`.
   - Visualizar métricas en tiempo real: Total de participantes, captados hoy, desglose por día y ranking de promotoras.
4. **Cierre de Jornadas (`/admin/jornadas`)**:
   - Ir a **Jornadas**.
   - En la jornada abierta (Día 3), presionar **CERRAR ALTAS**.
   - Confirmar en el modal: la jornada pasa a `CERRADA` y sus participantes se incorporan automáticamente a la **Base Master**.
5. **Base Master & Exportación CSV (`/admin/base-master`)**:
   - Observar el contador de habilitados para sorteo.
   - Filtrar por Día 1, Día 2, Día 3 o Todos.
   - Presionar **EXPORTAR CSV** para descargar la planilla con formato compatible con Excel.
6. **Ejecución del Sorteo (`/admin/sorteo`)**:
   - Verificar la población habilitada.
   - Presionar **REALIZAR SORTEO** y confirmar.
   - El motor del servidor selecciona criptográficamente **3 Ganadores Titulares** y **7 Suplentes** (posiciones 4 a 10).
7. **Pantalla Pública de Evento / TV (`/sorteo`)**:
   - Abrir en pestaña o monitor externo `http://localhost:3000/sorteo`.
   - Presionar **INICIAR SORTEO EN PANTALLA** para vivir la animación con ruleta de nombres, revelación secuencial y lluvia de confeti.
8. **Auditoría e Historial (`/admin/auditoria` y `/admin/sorteos`)**:
   - Comprobar que cada acción quedó registrada en la bitácora inmutable.
9. **Reinicio de Escenario DEMO (`/admin/configuracion`)**:
   - En cualquier momento se puede presionar el botón **REINICIAR DATOS DEMO** para restaurar el estado inicial.

---

## 📁 Estructura del Proyecto

```
sorteo-expo/
├── app/
│   ├── (auth)/
│   │   └── login/             # Pantalla de acceso
│   ├── (promotora)/
│   │   ├── captacion/         # Captura ultrarrápida móvil
│   │   ├── mis-registros/     # Registros propios de la promotora
│   │   └── layout.tsx         # Layout liviano para promotoras
│   ├── admin/
│   │   ├── page.tsx           # Dashboard analítico
│   │   ├── participantes/     # Tabla maestra de participantes
│   │   ├── promotoras/        # Administración de equipo
│   │   ├── jornadas/          # Apertura, cierre y pase a Base Master
│   │   ├── base-master/       # Población habilitada y exportación CSV
│   │   ├── sorteo/            # Ejecutor del sorteo
│   │   ├── sorteos/           # Historial de actas de sorteo
│   │   ├── auditoria/         # Bitácora inmutable de eventos
│   │   ├── configuracion/     # Parámetros globales y Reset Demo
│   │   └── layout.tsx         # Layout administrativo
│   ├── api/                   # Route handlers RESTful
│   ├── sorteo/                # Pantalla pública para TV/Proyector
│   ├── globals.css            # Estilos dark automotive & glassmorphism
│   └── layout.tsx             # Root layout y proveedor de notificaciones
├── components/
│   ├── ui/                    # Button, Input, Modal, Checkbox, Badge, StatCard, etc.
│   ├── admin/                 # AdminSidebar, AdminHeader
│   ├── promotora/             # PromotoraHeader
│   └── sorteo/                # LotteryStage cinemático con confetti
├── lib/
│   ├── auth.ts                # JWT, Cookies HTTP-Only, Bcrypt
│   ├── audit.ts               # Registrador de auditoría
│   ├── prisma.ts              # Cliente Prisma Singleton
│   └── utils.ts               # Normalización de IG, fechas y clases CSS
├── prisma/
│   ├── schema.prisma          # Modelado de entidades relacionales
│   └── seed.ts                # Generador de datos iniciales demo
└── dev.db                     # Base de datos local persistente SQLite
```

---

## 🔄 Preparación para Migración a Producción (Supabase / PostgreSQL)

La aplicación fue diseñada siguiendo el patrón de aislamiento de datos a través de **Prisma ORM**:

1. **Cambio de Proveedor de Base de Datos**:
   En `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Variable de Entorno**:
   Reemplazar `DATABASE_URL="file:./dev.db"` en `.env` por la cadena de conexión de Supabase/PostgreSQL:
   `DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"`
3. **Ejecución de migraciones en producción**:
   `npx prisma migrate deploy`
4. **Deploy en Vercel**:
   Subir a Vercel asignando las variables `DATABASE_URL` y `JWT_SECRET`.
