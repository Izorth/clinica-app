import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireActor, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatearRut, validarRut } from "@/lib/utils/rut";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { actor, error } = await requireActor();
  if (error) return error;

  // medicoId null (Usuario MEDICO sin fila Medico) no ve ningún paciente.
  if (actor.rol === "MEDICO" && !actor.medicoId) {
    return Response.json([]);
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const where: Prisma.PacienteWhereInput = {};
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { apellido: { contains: q, mode: "insensitive" } },
      { rut: { contains: q, mode: "insensitive" } },
    ];
  }
  if (actor.rol === "MEDICO") {
    where.horas = { some: { medicoId: actor.medicoId! } };
  }

  const pacientes = await prisma.paciente.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: 200,
    select: { id: true, rut: true, nombre: true, apellido: true, telefono: true, email: true },
  });

  return Response.json(pacientes);
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const body = await request.json();
  const { rut, nombre, apellido, telefono, email, fechaNac } = body;

  if (!rut || !nombre || !apellido || !telefono) {
    return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (!validarRut(rut)) {
    return Response.json(
      { error: "El RUT no es válido: el dígito verificador no corresponde" },
      { status: 400 }
    );
  }

  try {
    const paciente = await prisma.paciente.create({
      data: {
        // Se guarda canónico para que el mismo RUT no cree dos fichas.
        rut: formatearRut(rut),
        nombre,
        apellido,
        telefono,
        email: email || null,
        fechaNac: fechaNac ? new Date(fechaNac) : null,
      },
    });
    return Response.json(paciente, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Response.json({ error: "Ya existe un paciente con ese RUT" }, { status: 409 });
    }
    return Response.json({ error: "Error al crear paciente" }, { status: 500 });
  }
}
