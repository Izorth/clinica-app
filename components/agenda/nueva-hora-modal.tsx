"use client";

import { useState } from "react";

import type { Hora } from "./hora-card";

type Medico = {
  id: string;
  especialidad: string;
  usuario: { nombre: string };
};

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
};

type NuevaHoraModalProps = {
  fechaInicial: Date;
  medicos: Medico[];
  pacientes: Paciente[];
  onClose: () => void;
  onSave: (hora: Hora) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NuevaHoraModal({
  fechaInicial,
  medicos,
  pacientes,
  onClose,
  onSave,
}: NuevaHoraModalProps) {
  const [form, setForm] = useState({
    fecha: toDateStr(fechaInicial),
    hora: toTimeStr(fechaInicial),
    medicoId: medicos[0]?.id ?? "",
    pacienteId: "",
    estado: "PENDIENTE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteId) {
      setError("Selecciona un paciente");
      return;
    }
    if (!form.medicoId) {
      setError("Selecciona un médico");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [year, month, day] = form.fecha.split("-").map(Number);
      const [hours, minutes] = form.hora.split(":").map(Number);
      const fechaUTC = new Date(Date.UTC(year, month - 1, day, hours + 4, minutes));

      const res = await fetch("/api/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fechaUTC.toISOString(),
          medicoId: form.medicoId,
          pacienteId: form.pacienteId,
          estado: form.estado,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear la hora");
        return;
      }

      const nuevaHora: Hora = await res.json();
      onSave(nuevaHora);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Nueva hora
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Hora
              </label>
              <input
                type="time"
                value={form.hora}
                step={1800}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Médico
            </label>
            <select
              value={form.medicoId}
              onChange={(e) => setForm((f) => ({ ...f, medicoId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              required
            >
              {medicos.length === 0 && (
                <option value="">No hay médicos registrados</option>
              )}
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.usuario.nombre} — {m.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Paciente
            </label>
            <select
              value={form.pacienteId}
              onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              required
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} ({p.rut})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
