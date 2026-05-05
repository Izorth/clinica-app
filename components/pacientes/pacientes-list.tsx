"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Paciente = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
};

type PacientesListProps = {
  pacientes: Paciente[];
};

export function PacientesList({ pacientes }: PacientesListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pacientes;
    return pacientes.filter((p) => {
      const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
      return fullName.includes(term) || p.rut.toLowerCase().includes(term);
    });
  }, [pacientes, search]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pacientes
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Busca por nombre completo o RUT.
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  RUT
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre completo
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  Teléfono
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.rut}
                    </td>
                    <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                      {p.nombre} {p.apellido}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {p.telefono}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {p.email}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/pacientes/${p.id}`}
                        className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    No se encontraron pacientes con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
