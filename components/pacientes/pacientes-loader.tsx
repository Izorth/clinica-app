"use client";

import { useEffect, useState } from "react";

import { PacientesList } from "./pacientes-list";

type Paciente = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
};

export function PacientesLoader() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pacientes")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar pacientes");
        return res.json() as Promise<Paciente[]>;
      })
      .then((data) => {
        setPacientes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando pacientes...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return <PacientesList pacientes={pacientes} />;
}
