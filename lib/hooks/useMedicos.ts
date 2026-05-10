"use client";

import { useQuery } from "@tanstack/react-query";

export type Medico = {
  id: string;
  especialidad: string;
  usuario: { id: string; nombre: string; email: string };
  _count: { horas: number };
};

export function useMedicos() {
  return useQuery({
    queryKey: ["medicos"],
    queryFn: async () => {
      const res = await fetch("/api/medicos");
      if (!res.ok) throw new Error("Error cargando médicos");
      return res.json() as Promise<Medico[]>;
    },
  });
}
