/* eslint-disable @typescript-eslint/no-require-imports -- ts-node + proyecto ESM */
require("dotenv").config();

const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const { PrismaClient, Rol } = require("@prisma/client") as typeof import(
  "@prisma/client"
);

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync("admin123", 10);

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

  console.log(
    "Seed OK: usuario administrador listo (admin@clinica.cl, rol ADMIN).",
  );
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
