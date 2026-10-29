import type { NextRequest } from "next/server";

import { requireActor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const usuarioSelect = { usuario: { select: { id: true, nombre: true, email: true } } } as const;

async function ultimasHoras(medicoId: string) {
  return prisma.hora.findMany({
    where: { medicoId },
    include: { paciente: { select: { nombre: true, apellido: true } } },
    orderBy: { fecha: "desc" },
    take: 5,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { actor, error } = await requireActor();
  if (error) return error;

  const { id } = await params;
  const esPropio = actor.rol === "MEDICO" && actor.medicoId === id;
  // Directorio de médicos: todo el staff puede ver el registro. Pero la
  // agenda (horas + nombres de pacientes) solo la ven ADMIN/RECEPCIONISTA o
  // el propio médico sobre sí mismo — otro médico no debe ver a quién atiende
  // un colega.
  const puedeVerAgenda = actor.rol === "ADMIN" || actor.rol === "RECEPCIONISTA" || esPropio;

  const medico = await prisma.medico.findUnique({
    where: { id },
    include: usuarioSelect,
  });

  if (!medico) {
    return Response.json({ error: "Médico no encontrado" }, { status: 404 });
  }

  const horas = puedeVerAgenda ? await ultimasHoras(id) : [];
  return Response.json({ ...medico, horas });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { actor, error } = await requireActor();
  if (error) return error;

  const { id } = await params;
  const esPropio = actor.rol === "MEDICO" && actor.medicoId === id;
  if (actor.rol !== "ADMIN" && !esPropio) {
    return Response.json({ error: "Acceso denegado" }, { status: 403 });
  }

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
        include: usuarioSelect,
      });
    });

    return Response.json({ ...medico, horas: await ultimasHoras(id) });
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
  const { error } = await requireActor(["ADMIN"]);
  if (error) return error;

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
