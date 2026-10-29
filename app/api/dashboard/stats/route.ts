export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";

import { requireActor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const { actor, error } = await requireActor();
  if (error) return error;

  // medicoId null (Usuario MEDICO sin fila Medico) no ve ninguna estadística.
  if (actor.rol === "MEDICO" && !actor.medicoId) {
    return Response.json({
      totalPacientes: 0,
      pacientesEstaSemana: 0,
      horasHoy: 0,
      horasHoyConfirmadas: 0,
      horasPendientes: 0,
      ingresosMes: 0,
      mesLabel: "",
      fechaLabel: "",
      agendaHoy: [],
    });
  }
  const medicoId = actor.rol === "MEDICO" ? actor.medicoId! : null;

  const ahora = new Date();
  const hoy = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const inicioHoy = new Date(
    Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 4, 0, 0)
  );
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
  const hace7dias = new Date(inicioHoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    totalPacientes,
    pacientesEstaSemana,
    horasHoy,
    horasHoyConfirmadas,
    horasPendientes,
    pagosMes,
    agendaHoy,
  ] = await Promise.all([
    prisma.paciente
      .count({ where: medicoId ? { horas: { some: { medicoId } } } : undefined })
      .catch(() => 0),
    prisma.paciente
      .count({
        where: {
          creadoEn: { gte: hace7dias },
          ...(medicoId ? { horas: { some: { medicoId } } } : {}),
        },
      })
      .catch(() => 0),
    prisma.hora
      .count({ where: { fecha: { gte: inicioHoy, lt: finHoy }, ...(medicoId ? { medicoId } : {}) } })
      .catch(() => 0),
    prisma.hora
      .count({
        where: {
          fecha: { gte: inicioHoy, lt: finHoy },
          estado: "CONFIRMADA",
          ...(medicoId ? { medicoId } : {}),
        },
      })
      .catch(() => 0),
    prisma.hora
      .count({ where: { estado: "PENDIENTE", ...(medicoId ? { medicoId } : {}) } })
      .catch(() => 0),
    prisma.pago
      .aggregate({
        _sum: { monto: true },
        where: {
          estado: "PAGADO",
          creadoEn: { gte: inicioMes, lte: finMes },
          ...(medicoId ? { hora: { medicoId } } : {}),
        },
      })
      .catch(() => null),
    prisma.hora
      .findMany({
        where: { fecha: { gte: inicioHoy, lt: finHoy }, ...(medicoId ? { medicoId } : {}) },
        include: {
          paciente: { select: { nombre: true, apellido: true } },
          medico: { include: { usuario: { select: { nombre: true } } } },
        },
        orderBy: { fecha: "asc" },
        take: 10,
      })
      .catch(() => []),
  ]);

  const ingresosMes = pagosMes?._sum?.monto ?? 0;
  const mesLabel = hoy.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const fechaLabel = hoy.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

  return Response.json({
    totalPacientes,
    pacientesEstaSemana,
    horasHoy,
    horasHoyConfirmadas,
    horasPendientes,
    ingresosMes,
    mesLabel: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
    fechaLabel,
    agendaHoy,
  });
}
