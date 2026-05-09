import { getServerSession } from "next-auth/next";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarRecordatorioTemplate } from "@/lib/twilio";

export const dynamic = "force-dynamic";

const horaInclude = {
  medico: {
    include: {
      usuario: { select: { nombre: true } },
    },
  },
  paciente: {
    select: { id: true, nombre: true, apellido: true, rut: true, telefono: true },
  },
} as const;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const medicoId = searchParams.get("medicoId");
  const fechaInicio = searchParams.get("fechaInicio");
  const fechaFin = searchParams.get("fechaFin");

  const horas = await prisma.hora.findMany({
    where: {
      ...(medicoId ? { medicoId } : {}),
      ...(fechaInicio || fechaFin
        ? {
            fecha: {
              ...(fechaInicio ? { gte: new Date(fechaInicio) } : {}),
              ...(fechaFin ? { lte: new Date(fechaFin) } : {}),
            },
          }
        : {}),
    },
    include: horaInclude,
    orderBy: { fecha: "asc" },
  });

  return Response.json(horas);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { fecha, medicoId, pacienteId, estado } = body;

  if (!fecha || !medicoId || !pacienteId) {
    return Response.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  try {
    const hora = await prisma.hora.create({
      data: {
        fecha: new Date(fecha),
        medicoId,
        pacienteId,
        estado: estado ?? "PENDIENTE",
      },
      include: horaInclude,
    });

    if (hora.paciente.telefono) {
      void enviarRecordatorioTemplate(hora.paciente.telefono, hora.fecha);
    }

    return Response.json(hora, { status: 201 });
  } catch {
    return Response.json({ error: "Error al crear la hora" }, { status: 500 });
  }
}
