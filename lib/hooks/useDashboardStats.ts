"use client";

import { useQuery } from "@tanstack/react-query";

export type AgendaHora = {
  id: string;
  fecha: string;
  estado: string;
  paciente: { nombre: string; apellido: string };
  medico: { usuario: { nombre: string } };
};

export type DashboardStats = {
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

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Error cargando estadísticas");
      return res.json() as Promise<DashboardStats>;
    },
  });
}
