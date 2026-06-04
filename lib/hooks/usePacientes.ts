"use client";

import { useQuery } from "@tanstack/react-query";

export type Paciente = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
};

export type Ficha = {
  id: string;
  diagnostico: string;
  tratamiento: string | null;
  notas: string | null;
  creadoEn: string;
};

export type PacienteHora = {
  id: string;
  fecha: string;
  estado: string;
  medico: { usuario: { nombre: string } };
};

export type PacienteDetalle = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  fechaNac: string | null;
  fichas: Ficha[];
  horas: PacienteHora[];
};

export function usePacientes() {
  return useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const res = await fetch("/api/pacientes");
      if (!res.ok) throw new Error("Error cargando pacientes");
      return res.json() as Promise<Paciente[]>;
    },
  });
}

export function usePaciente(id: string) {
  return useQuery({
    queryKey: ["paciente", id],
    queryFn: async () => {
      const res = await fetch(`/api/pacientes/${id}`);
      if (res.status === 404) throw new Error("Paciente no encontrado");
      if (!res.ok) throw new Error("Error al cargar el paciente");
      return res.json() as Promise<PacienteDetalle>;
    },
    enabled: !!id,
  });
}
