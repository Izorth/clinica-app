/* eslint-disable @typescript-eslint/no-require-imports -- ts-node + proyecto ESM */
require("dotenv").config();

const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const {
  PrismaClient,
  Rol,
  EstadoHora,
  EstadoPago,
} = require("@prisma/client") as typeof import("@prisma/client");

const prisma = new PrismaClient();

// Helper: construye una fecha relativa al "hoy" del servidor
function fecha(offsetDias: number, hora: number, minutos = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  d.setHours(hora, minutos, 0, 0);
  return d;
}

async function main() {
  const passwordHash = bcrypt.hashSync("admin123", 10);

  // ─── Limpieza: pacientes basura sembrados a mano durante pruebas ─────────
  // Solo borra los RUT que claramente no son del seed oficial.
  await prisma.hora.deleteMany({
    where: {
      paciente: {
        rut: { in: ["123123123", "18586295k", "asdasd"] },
      },
    },
  });
  await prisma.pago.deleteMany({
    where: {
      paciente: {
        rut: { in: ["123123123", "18586295k", "asdasd"] },
      },
    },
  });
  await prisma.ficha.deleteMany({
    where: {
      paciente: {
        rut: { in: ["123123123", "18586295k", "asdasd"] },
      },
    },
  });
  await prisma.paciente.deleteMany({
    where: { rut: { in: ["123123123", "18586295k", "asdasd"] } },
  });
  console.log("✓ Limpieza de registros basura");

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
  const pacientesData = [
    { rut: "12.345.678-9", nombre: "María",      apellido: "López",     telefono: "+56912345678", email: "maria.lopez@email.cl" },
    { rut: "9.876.543-2",  nombre: "Juan",       apellido: "Pérez",     telefono: "+56987654321", email: "juan.perez@email.cl" },
    { rut: "15.432.198-7", nombre: "Sofía",      apellido: "Ramírez",   telefono: "+56911223344", email: "sofia.ramirez@email.cl" },
    { rut: "16.234.567-K", nombre: "Carolina",   apellido: "Soto",      telefono: "+56922334455", email: "carolina.soto@email.cl" },
    { rut: "14.567.890-1", nombre: "José",       apellido: "Muñoz",     telefono: "+56933445566", email: "jose.munoz@email.cl" },
    { rut: "17.891.234-5", nombre: "Camila",     apellido: "Rojas",     telefono: "+56944556677", email: "camila.rojas@email.cl" },
    { rut: "13.456.789-0", nombre: "Felipe",     apellido: "Tapia",     telefono: "+56955667788", email: "felipe.tapia@email.cl" },
    { rut: "18.234.567-8", nombre: "Valentina",  apellido: "Silva",     telefono: "+56966778899", email: "valentina.silva@email.cl" },
    { rut: "11.876.543-4", nombre: "Diego",      apellido: "Vargas",    telefono: "+56977889900", email: "diego.vargas@email.cl" },
    { rut: "19.345.678-2", nombre: "Constanza",  apellido: "Fuentes",   telefono: "+56988990011", email: "constanza.fuentes@email.cl" },
    { rut: "15.987.654-3", nombre: "Matías",     apellido: "Contreras", telefono: "+56999001122", email: "matias.contreras@email.cl" },
    { rut: "16.789.012-6", nombre: "Antonia",    apellido: "Herrera",   telefono: "+56912340987", email: "antonia.herrera@email.cl" },
  ];

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
