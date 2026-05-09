import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarRecordatorioTemplate } from "@/lib/twilio";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    select: { telefono: true },
  });

  if (!paciente) {
    return Response.json({ ok: false, error: "Paciente no encontrado" }, { status: 404 });
  }

  if (!paciente.telefono) {
    return Response.json({ ok: false, error: "El paciente no tiene teléfono registrado" });
  }

  const proximaHora = await prisma.hora.findFirst({
    where: {
      pacienteId: id,
      fecha: { gte: new Date() },
      estado: { in: ["CONFIRMADA", "PENDIENTE"] },
    },
    orderBy: { fecha: "asc" },
  });

  if (!proximaHora) {
    return Response.json({ ok: false, error: "El paciente no tiene horas próximas" });
  }

  const resultado = await enviarRecordatorioTemplate(
    paciente.telefono,
    proximaHora.fecha
  );

  if (!resultado.ok) {
    return Response.json({ ok: false, error: resultado.error });
  }

  return Response.json({ ok: true });
}
