/* eslint-disable @typescript-eslint/no-require-imports -- ts-node + proyecto ESM */
require("dotenv").config();

const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const { PrismaClient, Rol } = require("@prisma/client") as typeof import(
  "@prisma/client"
);

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync("admin123", 10);

  // Admin
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

  // Médicos
  const medicosData = [
    { email: "dr.gonzalez@clinica.cl", nombre: "Carlos González", especialidad: "Medicina General" },
    { email: "dra.morales@clinica.cl", nombre: "Ana Morales", especialidad: "Pediatría" },
  ];

  for (const m of medicosData) {
    const usuario = await prisma.usuario.upsert({
      where: { email: m.email },
      create: { email: m.email, nombre: m.nombre, password: passwordHash, rol: Rol.MEDICO },
      update: { nombre: m.nombre, rol: Rol.MEDICO },
    });
    await prisma.medico.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, especialidad: m.especialidad },
      update: { especialidad: m.especialidad },
    });
    console.log(`✓ Médico: ${m.nombre} (${m.especialidad})`);
  }

  // Pacientes
  const pacientesData = [
    { rut: "12.345.678-9", nombre: "María", apellido: "López", telefono: "+56912345678", email: "maria.lopez@email.cl" },
    { rut: "9.876.543-2", nombre: "Juan", apellido: "Pérez", telefono: "+56987654321", email: "juan.perez@email.cl" },
    { rut: "15.432.198-7", nombre: "Sofía", apellido: "Ramírez", telefono: "+56911223344", email: "sofia.ramirez@email.cl" },
  ];

  for (const p of pacientesData) {
    await prisma.paciente.upsert({
      where: { rut: p.rut },
      create: p,
      update: { nombre: p.nombre, apellido: p.apellido, telefono: p.telefono },
    });
    console.log(`✓ Paciente: ${p.nombre} ${p.apellido} (${p.rut})`);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
