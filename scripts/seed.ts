/* eslint-disable @typescript-eslint/no-require-imports -- ts-node + proyecto ESM */
require("dotenv").config();

const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const {
  PrismaClient,
  Rol,
  EstadoHora,
  EstadoPago,
} = require("@prisma/client") as typeof import("@prisma/client");

const { validarRut } = require("../lib/utils/rut") as typeof import("../lib/utils/rut");

const prisma = new PrismaClient();

// ─── Pacientes de demostración ─────────────────────────────────────────────
// Datos ficticios para demos y para el video de marketing. Dos reglas:
//
// 1. Los apellidos son poco frecuentes, elegidos para que no evoquen a nadie en
//    particular. No están verificados contra ningún registro civil: es
//    perfectamente posible que existan personas con estos apellidos.
// 2. TODOS los RUT tienen dígito verificador inválido a propósito, para que no
//    puedan coincidir con el RUT de una persona real. Lo verifica el guard de
//    abajo en cada corrida. La app rechaza estos RUT si se tipean en el
//    formulario — es intencional: el seed escribe con Prisma directo, saltándose
//    la validación del handler.
const pacientesData = [
  { rut: "13.847.265-6", nombre: "Renata",   apellido: "Olmedilla",  telefono: "+56920000000", email: "renata.olmedilla@ejemplo.cl" },
  { rut: "17.293.846-0", nombre: "Bruno",    apellido: "Cerezuela",  telefono: "+56921111111", email: "bruno.cerezuela@ejemplo.cl" },
  { rut: "15.628.394-1", nombre: "Ignacia",  apellido: "Fresnedo",   telefono: "+56922222222", email: "ignacia.fresnedo@ejemplo.cl" },
  { rut: "19.472.638-5", nombre: "Teodoro",  apellido: "Almendral",  telefono: "+56923333333", email: "teodoro.almendral@ejemplo.cl" },
  { rut: "14.385.927-5", nombre: "Javiera",  apellido: "Nevares",    telefono: "+56924444444", email: "javiera.nevares@ejemplo.cl" },
  { rut: "18.264.739-1", nombre: "Emilio",   apellido: "Jarandilla", telefono: "+56925555555", email: "emilio.jarandilla@ejemplo.cl" },
  { rut: "16.739.482-6", nombre: "Amparo",   apellido: "Higueral",   telefono: "+56926666666", email: "amparo.higueral@ejemplo.cl" },
  { rut: "12.958.374-7", nombre: "Nicolás",  apellido: "Endrino",    telefono: "+56927777777", email: "nicolas.endrino@ejemplo.cl" },
  { rut: "20.174.853-5", nombre: "Rocío",    apellido: "Pedregal",   telefono: "+56928888888", email: "rocio.pedregal@ejemplo.cl" },
  { rut: "11.539.286-8", nombre: "Gaspar",   apellido: "Lomeña",     telefono: "+56929999999", email: "gaspar.lomena@ejemplo.cl" },
  { rut: "17.846.291-2", nombre: "Marisol",  apellido: "Bracamonte", telefono: "+56931111110", email: "marisol.bracamonte@ejemplo.cl" },
  { rut: "15.294.867-1", nombre: "Damián",   apellido: "Valdenegro", telefono: "+56932222221", email: "damian.valdenegro@ejemplo.cl" },
];

// Helper: construye una fecha relativa al "hoy" del servidor
function fecha(offsetDias: number, hora: number, minutos = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  d.setHours(hora, minutos, 0, 0);
  return d;
}

async function main() {
  // Guard: ningún RUT del seed puede tener DV válido. Si alguien edita la lista
  // de arriba y le acierta al dígito verificador sin querer, el seed no corre.
  const validos = pacientesData.filter((p) => validarRut(p.rut));
  if (validos.length > 0) {
    throw new Error(
      `Estos RUT del seed tienen DV VÁLIDO y podrían pertenecer a alguien real: ` +
        `${validos.map((p) => p.rut).join(", ")}. Cámbialos antes de sembrar.`
    );
  }

  const passwordHash = bcrypt.hashSync("admin123", 10);

  // ─── Limpieza: todo paciente que no sea del seed ─────────────────────────
  // Incluye los pacientes de seeds anteriores (que tenían otros RUT y nombres
  // realistas), la basura tecleada a mano y los que se crean al grabar el video.
  // Acotado a tablas de la clínica: esta base la comparte otro proyecto.
  const rutsDelSeed = pacientesData.map((p) => p.rut);
  const ajenos = { paciente: { rut: { notIn: rutsDelSeed } } };
  await prisma.pago.deleteMany({ where: ajenos });
  await prisma.ficha.deleteMany({ where: ajenos });
  await prisma.hora.deleteMany({ where: ajenos });
  const borrados = await prisma.paciente.deleteMany({
    where: { rut: { notIn: rutsDelSeed } },
  });
  console.log(`✓ Limpieza: ${borrados.count} pacientes ajenos al seed borrados`);

  // ─── Admin ───────────────────────────────────────────────────────────────
  await prisma.usuario.upsert({
    where: { email: "admin@clinica.cl" },
    create: {
      email: "admin@clinica.cl",
      nombre: "Administrador",
      password: passwordHash,
      rol: Rol.ADMIN,
    },
    update: {
      nombre: "Administrador",
      password: passwordHash,
      rol: Rol.ADMIN,
    },
  });
  console.log("✓ Admin listo");

  // ─── Médicos ─────────────────────────────────────────────────────────────
  const medicosData = [
    { email: "dr.gonzalez@clinica.cl", nombre: "Carlos González", especialidad: "Medicina General" },
    { email: "dra.morales@clinica.cl", nombre: "Ana Morales", especialidad: "Pediatría" },
    { email: "dr.rivera@clinica.cl", nombre: "Felipe Rivera", especialidad: "Cardiología" },
    { email: "dra.castro@clinica.cl", nombre: "Daniela Castro", especialidad: "Dermatología" },
    { email: "dra.nunez@clinica.cl", nombre: "Paula Núñez", especialidad: "Ginecología" },
    { email: "dr.torres@clinica.cl", nombre: "Sebastián Torres", especialidad: "Traumatología" },
  ];

  const medicos: { id: string; especialidad: string; nombre: string }[] = [];
  for (const m of medicosData) {
    const usuario = await prisma.usuario.upsert({
      where: { email: m.email },
      create: { email: m.email, nombre: m.nombre, password: passwordHash, rol: Rol.MEDICO },
      update: { nombre: m.nombre, rol: Rol.MEDICO },
    });
    const medico = await prisma.medico.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, especialidad: m.especialidad },
      update: { especialidad: m.especialidad },
    });
    medicos.push({ id: medico.id, especialidad: m.especialidad, nombre: m.nombre });
    console.log(`✓ Médico: ${m.nombre} (${m.especialidad})`);
  }

  // ─── Pacientes ───────────────────────────────────────────────────────────
  const pacientes: { id: string; nombre: string; apellido: string }[] = [];
  for (const p of pacientesData) {
    const paciente = await prisma.paciente.upsert({
      where: { rut: p.rut },
      create: p,
      update: { nombre: p.nombre, apellido: p.apellido, telefono: p.telefono, email: p.email },
    });
    pacientes.push({ id: paciente.id, nombre: p.nombre, apellido: p.apellido });
    console.log(`✓ Paciente: ${p.nombre} ${p.apellido} (${p.rut})`);
  }

  // ─── Horas (citas) ───────────────────────────────────────────────────────
  // Limpia citas anteriores para no duplicar entre runs.
  await prisma.pago.deleteMany({});
  await prisma.hora.deleteMany({});

  type HoraPlan = {
    offset: number;
    hora: number;
    minutos: number;
    pacienteIdx: number;
    medicoIdx: number;
    estado: keyof typeof EstadoHora;
  };

  // Distribución de la semana (lun=0 si hoy es lunes; ajusta dinámicamente)
  // Hoy = offset 0. La agenda muestra la semana en curso, así que repartimos
  // de hoy + 6 días para llenar la vista semanal.
  const plan: HoraPlan[] = [
    // ── Hoy ───────────────────────────────────────────────
    { offset: 0, hora: 9,  minutos: 0,  pacienteIdx: 0,  medicoIdx: 0, estado: "CONFIRMADA" },
    { offset: 0, hora: 10, minutos: 30, pacienteIdx: 1,  medicoIdx: 1, estado: "CONFIRMADA" },
    { offset: 0, hora: 12, minutos: 0,  pacienteIdx: 2,  medicoIdx: 2, estado: "PENDIENTE"  },
    { offset: 0, hora: 15, minutos: 30, pacienteIdx: 3,  medicoIdx: 3, estado: "CONFIRMADA" },
    { offset: 0, hora: 17, minutos: 0,  pacienteIdx: 4,  medicoIdx: 4, estado: "PENDIENTE"  },
    // ── Mañana ────────────────────────────────────────────
    { offset: 1, hora: 9,  minutos: 30, pacienteIdx: 5,  medicoIdx: 0, estado: "CONFIRMADA" },
    { offset: 1, hora: 11, minutos: 0,  pacienteIdx: 6,  medicoIdx: 5, estado: "CONFIRMADA" },
    { offset: 1, hora: 14, minutos: 0,  pacienteIdx: 7,  medicoIdx: 1, estado: "PENDIENTE"  },
    { offset: 1, hora: 16, minutos: 30, pacienteIdx: 8,  medicoIdx: 2, estado: "CONFIRMADA" },
    // ── +2 días ───────────────────────────────────────────
    { offset: 2, hora: 8,  minutos: 30, pacienteIdx: 9,  medicoIdx: 4, estado: "CONFIRMADA" },
    { offset: 2, hora: 10, minutos: 0,  pacienteIdx: 10, medicoIdx: 3, estado: "PENDIENTE"  },
    { offset: 2, hora: 12, minutos: 30, pacienteIdx: 11, medicoIdx: 0, estado: "CONFIRMADA" },
    { offset: 2, hora: 15, minutos: 0,  pacienteIdx: 0,  medicoIdx: 5, estado: "CONFIRMADA" },
    // ── +3 días ───────────────────────────────────────────
    { offset: 3, hora: 9,  minutos: 0,  pacienteIdx: 2,  medicoIdx: 1, estado: "CONFIRMADA" },
    { offset: 3, hora: 11, minutos: 30, pacienteIdx: 4,  medicoIdx: 2, estado: "CONFIRMADA" },
    { offset: 3, hora: 14, minutos: 30, pacienteIdx: 6,  medicoIdx: 4, estado: "PENDIENTE"  },
    // ── +4 días ───────────────────────────────────────────
    { offset: 4, hora: 10, minutos: 0,  pacienteIdx: 8,  medicoIdx: 3, estado: "CONFIRMADA" },
    { offset: 4, hora: 12, minutos: 0,  pacienteIdx: 10, medicoIdx: 0, estado: "CONFIRMADA" },
    // ── Historial: hace 1-15 días, completadas + pagadas ──
    { offset: -1,  hora: 10, minutos: 0,  pacienteIdx: 1,  medicoIdx: 0, estado: "COMPLETADA" },
    { offset: -2,  hora: 11, minutos: 30, pacienteIdx: 3,  medicoIdx: 1, estado: "COMPLETADA" },
    { offset: -3,  hora: 15, minutos: 0,  pacienteIdx: 5,  medicoIdx: 2, estado: "COMPLETADA" },
    { offset: -5,  hora: 9,  minutos: 30, pacienteIdx: 7,  medicoIdx: 3, estado: "COMPLETADA" },
    { offset: -7,  hora: 14, minutos: 0,  pacienteIdx: 9,  medicoIdx: 4, estado: "COMPLETADA" },
    { offset: -10, hora: 12, minutos: 30, pacienteIdx: 11, medicoIdx: 5, estado: "COMPLETADA" },
    { offset: -14, hora: 10, minutos: 0,  pacienteIdx: 0,  medicoIdx: 0, estado: "COMPLETADA" },
  ];

  const montosPorEspecialidad: Record<string, number> = {
    "Medicina General": 25000,
    "Pediatría":        30000,
    "Cardiología":      45000,
    "Dermatología":     40000,
    "Ginecología":      38000,
    "Traumatología":    42000,
  };

  for (const item of plan) {
    const paciente = pacientes[item.pacienteIdx];
    const medico = medicos[item.medicoIdx];
    const hora = await prisma.hora.create({
      data: {
        fecha: fecha(item.offset, item.hora, item.minutos),
        estado: EstadoHora[item.estado],
        medicoId: medico.id,
        pacienteId: paciente.id,
      },
    });

    // Las citas completadas tienen pago realizado
    if (item.estado === "COMPLETADA") {
      await prisma.pago.create({
        data: {
          horaId: hora.id,
          pacienteId: paciente.id,
          monto: montosPorEspecialidad[medico.especialidad] ?? 25000,
          estado: EstadoPago.PAGADO,
        },
      });
    }
  }
  console.log(`✓ ${plan.length} horas creadas (${plan.filter((p) => p.estado === "COMPLETADA").length} pagadas)`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
