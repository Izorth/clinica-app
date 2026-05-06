import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const pacientes = await prisma.paciente.findMany({
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      rut: true,
      nombre: true,
      apellido: true,
      telefono: true,
      email: true,
    },
  });

  return Response.json(pacientes);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { rut, nombre, apellido, telefono, email, fechaNac } = body;

  if (!rut || !nombre || !apellido || !telefono) {
    return Response.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  try {
    const paciente = await prisma.paciente.create({
      data: {
        rut,
        nombre,
        apellido,
        telefono,
        email: email || null,
        fechaNac: fechaNac ? new Date(fechaNac) : null,
      },
    });
    return Response.json(paciente, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Ya existe un paciente con ese RUT" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Error al crear paciente" }, { status: 500 });
  }
}
