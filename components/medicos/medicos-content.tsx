"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMedicos } from "@/lib/hooks/useMedicos";
import { MedicosSkeleton } from "./medicos-skeleton";

export function MedicosContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: medicos = [], isLoading, error } = useMedicos();

  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medicos;
    return medicos.filter(
      (m) =>
        m.usuario.nombre.toLowerCase().includes(term) ||
        m.especialidad.toLowerCase().includes(term),
    );
  }, [medicos, search]);

  const deleteMedico = useMutation({
    mutationFn: async (medicoId: string) => {
      const res = await fetch(`/api/medicos/${medicoId}`, { method: "DELETE" });
      if (res.status !== 204) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Error al eliminar");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicos"] });
      setDeleteError("");
    },
    onError: (err: Error) => {
      setDeleteError(err.message);
    },
  });

  async function handleEliminar(medico: { id: string; usuario: { nombre: string } }) {
    setDeleteError("");
    if (!confirm(`¿Eliminar al médico ${medico.usuario.nombre}? Esta acción no se puede deshacer.`))
      return;
    deleteMedico.mutate(medico.id);
  }

  if (isLoading) return <MedicosSkeleton />;

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Médicos</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Busca por nombre o especialidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            onClick={() => router.push("/dashboard/medicos/nuevo")}
            className="whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Nuevo médico
          </button>
        </div>
      </div>

      {deleteError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {deleteError}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Nombre</th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Email</th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Especialidad</th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">N° Horas</th>
                <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.length > 0 ? (
                filtered.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {m.usuario.nombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{m.usuario.email}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{m.especialidad}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {m._count.horas}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/medicos/${m.id}`)}
                          className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleEliminar(m)}
                          disabled={deleteMedico.isPending && deleteMedico.variables === m.id}
                          className="inline-flex rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          {deleteMedico.isPending && deleteMedico.variables === m.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    No se encontraron médicos con ese criterio.
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
