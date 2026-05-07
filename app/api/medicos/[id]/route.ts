import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const medicoDetalleInclude = {
  usuario: { select: { id: true, nombre: true, email: true } },
  horas: {
    include: {
      paciente: { select: { nombre: true, apellido: true } },
    },
    orderBy: { fecha: "desc" as const },
    take: 5,
  },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const medico = await prisma.medico.findUnique({
    where: { id },
    include: medicoDetalleInclude,
  });

  if (!medico) {
    return Response.json({ error: "Médico no encontrado" }, { status: 404 });
  }

  return Response.json(medico);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { nombre, email, especialidad } = body;

  try {
    const medico = await prisma.$transaction(async (tx) => {
      const existing = await tx.medico.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND");

      if (nombre !== undefined || email !== undefined) {
        await tx.usuario.update({
          where: { id: existing.usuarioId },
          data: {
            ...(nombre !== undefined ? { nombre } : {}),
            ...(email !== undefined ? { email } : {}),
          },
        });
      }

      if (especialidad !== undefined) {
        await tx.medico.update({ where: { id }, data: { especialidad } });
      }

      return tx.medico.findUniqueOrThrow({
        where: { id },
        include: medicoDetalleInclude,
      });
    });

    return Response.json(medico);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return Response.json({ error: "Médico no encontrado" }, { status: 404 });
    }
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
    return Response.json({ error: "Error al actualizar el médico" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const medico = await tx.medico.findUnique({
        where: { id },
        include: { _count: { select: { horas: true } } },
      });
      if (!medico) throw new Error("NOT_FOUND");
      if (medico._count.horas > 0) throw new Error("HAS_HORAS");

      await tx.medico.delete({ where: { id } });
      await tx.usuario.delete({ where: { id: medico.usuarioId } });
    });

    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return Response.json({ error: "Médico no encontrado" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "HAS_HORAS") {
      return Response.json(
        { error: "No se puede eliminar un médico con horas agendadas" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Error al eliminar el médico" }, { status: 500 });
  }
}
