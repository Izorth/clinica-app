import type { NextRequest } from "next/server";

import { requireActor } from "@/lib/auth-helpers";
import { horaInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { actor, error } = await requireActor();
  if (error) return error;

  const { id } = await params;
  const hora = await prisma.hora.findUnique({ where: { id }, include: horaInclude });

  if (!hora || (actor.rol === "MEDICO" && hora.medicoId !== actor.medicoId)) {
    return Response.json({ error: "Hora no encontrada" }, { status: 404 });
  }

  return Response.json(hora);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { actor, error } = await requireActor(["ADMIN", "RECEPCIONISTA", "MEDICO"]);
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.hora.findUnique({ where: { id }, select: { medicoId: true } });
  if (!existing || (actor.rol === "MEDICO" && existing.medicoId !== actor.medicoId)) {
    return Response.json({ error: "Hora no encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const { estado, fecha, medicoId, pacienteId } = body;

  if (actor.rol === "MEDICO" && (medicoId !== undefined || pacienteId !== undefined)) {
    return Response.json(
      { error: "Un médico no puede reasignar médico o paciente de una hora" },
      { status: 403 }
    );
  }

  if (medicoId !== undefined) {
    const existeMedico = await prisma.medico.findUnique({ where: { id: medicoId }, select: { id: true } });
    if (!existeMedico) {
      return Response.json({ error: "El médico indicado no existe" }, { status: 400 });
    }
  }
  if (pacienteId !== undefined) {
    const existePaciente = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } });
    if (!existePaciente) {
      return Response.json({ error: "El paciente indicado no existe" }, { status: 400 });
    }
  }

  try {
    const hora = await prisma.hora.update({
      where: { id },
      data: {
        ...(estado !== undefined ? { estado } : {}),
        ...(fecha !== undefined ? { fecha: new Date(fecha) } : {}),
        ...(medicoId !== undefined ? { medicoId } : {}),
        ...(pacienteId !== undefined ? { pacienteId } : {}),
      },
      include: horaInclude,
    });
    return Response.json(hora);
  } catch {
    return Response.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireActor(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.hora.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
