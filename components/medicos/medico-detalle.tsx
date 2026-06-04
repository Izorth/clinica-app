"use client";

import { useState } from "react";

import { estadoBadgeClass, ESTADO_LABELS } from "@/lib/utils/estados";

type HoraMedico = {
  id: string;
  fecha: string;
  estado: string;
  paciente: { nombre: string; apellido: string };
};

type MedicoDetalle = {
  id: string;
  especialidad: string;
  usuario: { id: string; nombre: string; email: string };
  horas: HoraMedico[];
};

type MedicoDetalleProps = {
  medico: MedicoDetalle;
};

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { fecha, hora };
}

export function MedicoDetalle({ medico: initial }: MedicoDetalleProps) {
  const [medico, setMedico] = useState<MedicoDetalle>(initial);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: initial.usuario.nombre,
    especialidad: initial.especialidad,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/medicos/${medico.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          especialidad: form.especialidad,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Error al guardar");
        return;
      }
      const updated: MedicoDetalle = await res.json();
      setMedico(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {medico.usuario.nombre}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {medico.especialidad}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {medico.usuario.email}
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => {
                setForm({ nombre: medico.usuario.nombre, especialidad: medico.especialidad });
                setSaveError("");
                setEditing(true);
              }}
              className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Editar
            </button>
          )}
        </div>

        {editing && (
          <form onSubmit={handleGuardar} className="mt-5 grid gap-4">
            {saveError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {saveError}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Nombre</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Especialidad</span>
                <input
                  type="text"
                  value={form.especialidad}
                  onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Últimas horas agendadas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-2 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Fecha</th>
                <th className="px-2 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Hora</th>
                <th className="px-2 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Paciente</th>
                <th className="px-2 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {medico.horas.length > 0 ? (
                medico.horas.map((hora) => {
                  const { fecha, hora: horaStr } = formatFechaHora(hora.fecha);
                  return (
                    <tr
                      key={hora.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-2 py-3 text-zinc-800 dark:text-zinc-200">
                        {fecha}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {horaStr}
                      </td>
                      <td className="px-2 py-3 text-zinc-700 dark:text-zinc-300">
                        {hora.paciente.nombre} {hora.paciente.apellido}
                      </td>
                      <td className="px-2 py-3">
                        <span className={estadoBadgeClass(hora.estado)}>
                          {ESTADO_LABELS[hora.estado] ?? hora.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    Sin horas agendadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
