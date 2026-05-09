"use client";

import { useCallback, useEffect, useState } from "react";

import { supabaseClient } from "@/lib/supabase-client";

type AgendaHora = {
  id: string;
  fecha: string;
  estado: string;
  paciente: { nombre: string; apellido: string };
  medico: { usuario: { nombre: string } };
};

type Stats = {
  totalPacientes: number;
  pacientesEstaSemana: number;
  horasHoy: number;
  horasHoyConfirmadas: number;
  horasPendientes: number;
  ingresosMes: number;
  mesLabel: string;
  fechaLabel: string;
  agendaHoy: AgendaHora[];
};

type Props = Stats;

function formatMonto(monto: number): string {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `$${Math.round(monto / 1_000)}K`;
  return `$${monto.toLocaleString("es-CL")}`;
}

function estadoBadgeClass(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-500/30";
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-950/50 dark:text-yellow-200 dark:ring-yellow-500/30";
    case "CANCELADA":
      return "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-500/30";
    default:
      return "bg-zinc-100 text-zinc-600 ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};

function formatHoraSantiago(iso: string) {
  const d = new Date(iso);
  const s = new Date(d.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  return `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`;
}

export function DashboardContent(initialStats: Props) {
  const [stats, setStats] = useState<Stats>(initialStats);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Stats;
        setStats(data);
      }
    } catch {
      // silencio — no interrumpir la UI por un fallo de red
    }
  }, []);

  useEffect(() => {
    // Polling de respaldo (por si Realtime no está disponible)
    const interval = setInterval(fetchStats, 30000);

    // Suscripción realtime: refresca al instante cuando cambia la tabla Hora
    // (p.ej. al confirmar/cancelar desde WhatsApp via webhook de Twilio).
    const channel = supabaseClient
      .channel("dashboard-hora-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Hora" },
        () => {
          fetchStats();
        },
      )
      .subscribe();

    // Refresca también al volver a enfocar la pestaña/ventana
    const handleFocus = () => fetchStats();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchStats]);

  const summaryCards = [
    {
      title: "Total Pacientes",
      value: stats.totalPacientes.toString(),
      hint: `+${stats.pacientesEstaSemana} esta semana`,
    },
    {
      title: "Horas de Hoy",
      value: stats.horasHoy.toString(),
      hint: `${stats.horasHoyConfirmadas} confirmadas`,
    },
    {
      title: "Horas Pendientes",
      value: stats.horasPendientes.toString(),
      hint: "Requieren confirmación",
    },
    {
      title: "Ingresos del Mes",
      value: formatMonto(stats.ingresosMes),
      hint: stats.mesLabel,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Resumen</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Datos en tiempo real desde la base de datos.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <li
              key={card.title}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{card.value}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{card.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Próximas horas del día
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Agenda de hoy — {stats.fechaLabel}.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {stats.agendaHoy.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No hay horas agendadas para hoy.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Hora</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Paciente</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Médico</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {stats.agendaHoy.map((hora) => (
                    <tr
                      key={hora.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatHoraSantiago(hora.fecha)}
                      </td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {hora.paciente.nombre} {hora.paciente.apellido}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {hora.medico.usuario.nombre}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoBadgeClass(hora.estado)}`}
                        >
                          {ESTADO_LABELS[hora.estado] ?? hora.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
