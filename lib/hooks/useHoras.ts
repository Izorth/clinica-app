"use client";

import { useQuery } from "@tanstack/react-query";

import type { Hora } from "@/components/agenda/hora-card";

type HorasParams = {
  fechaInicio: string;
  fechaFin: string;
  medicoId?: string;
};

export function useHoras(params: HorasParams) {
  return useQuery({
    queryKey: ["horas", params],
    queryFn: async () => {
      const url = new URL("/api/horas", window.location.origin);
      url.searchParams.set("fechaInicio", params.fechaInicio);
      url.searchParams.set("fechaFin", params.fechaFin);
      if (params.medicoId) url.searchParams.set("medicoId", params.medicoId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error cargando horas");
      return res.json() as Promise<Hora[]>;
    },
  });
}
