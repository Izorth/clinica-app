import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const medicoInclude = {
  usuario: { select: { id: true, nombre: true, email: true } },
  _count: { select: { horas: true } },
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const medicos = await prisma.medico.findMany({
    include: medicoInclude,
    orderBy: { usuario: { nombre: "asc" } },
  });

  return Response.json(medicos);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { nombre, email, password, especialidad } = body;

  if (!nombre || !email || !password || !especialidad) {
    return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (typeof password === "string" && password.length < 6) {
    return Response.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const medico = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { nombre, email, password: passwordHash, rol: "MEDICO" },
      });
      return tx.medico.create({
        data: { usuarioId: usuario.id, especialidad },
        include: medicoInclude,
      });
    });
    return Response.json(medico, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Error al crear el médico" }, { status: 500 });
  }
}
