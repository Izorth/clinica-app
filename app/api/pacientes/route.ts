import type { NextRequest } from "next/server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const pacientes = await prisma.paciente.findMany({
    where: q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { apellido: { contains: q, mode: "insensitive" } },
            { rut: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
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
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Response.json({ error: "Ya existe un paciente con ese RUT" }, { status: 409 });
    }
    return Response.json({ error: "Error al crear paciente" }, { status: 500 });
  }
}
