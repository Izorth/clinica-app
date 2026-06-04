import type { NextRequest } from "next/server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { horaInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const hora = await prisma.hora.findUnique({ where: { id }, include: horaInclude });

  if (!hora) {
    return Response.json({ error: "Hora no encontrada" }, { status: 404 });
  }

  return Response.json(hora);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA", "MEDICO"]);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { estado, fecha, medicoId, pacienteId } = body;

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
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.hora.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
