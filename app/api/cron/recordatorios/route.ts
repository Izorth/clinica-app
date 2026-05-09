import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { enviarRecordatorioTemplate } from "@/lib/twilio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const mananaInicio = new Date(ahora);
  mananaInicio.setDate(mananaInicio.getDate() + 1);
  mananaInicio.setHours(0, 0, 0, 0);

  const mananaFin = new Date(mananaInicio);
  mananaFin.setHours(23, 59, 59, 999);

  const horas = await prisma.hora.findMany({
    where: {
      fecha: { gte: mananaInicio, lte: mananaFin },
      estado: { in: ["CONFIRMADA", "PENDIENTE"] },
    },
    include: {
      paciente: { select: { telefono: true, nombre: true, apellido: true } },
      medico: { include: { usuario: { select: { nombre: true } } } },
    },
  });

  let enviados = 0;
  let errores = 0;
  const detalles: { horaId: string; ok: boolean; error?: string }[] = [];

  for (const hora of horas) {
    if (!hora.paciente.telefono) continue;
    const resultado = await enviarRecordatorioTemplate(
      hora.paciente.telefono,
      hora.fecha
    );
    if (resultado.ok) {
      enviados++;
    } else {
      errores++;
    }
    detalles.push({ horaId: hora.id, ok: resultado.ok, error: resultado.error });
  }

  return Response.json({ enviados, errores, detalles });
}
