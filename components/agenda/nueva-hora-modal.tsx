"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";

import type { EstadoHora, Hora } from "./hora-card";

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
}: NuevaHoraModalProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fecha: toDateStr(fechaInicial),
    hora: toTimeStr(fechaInicial),
    medicoId: medicos[0]?.id ?? "",
    pacienteId: "",
    estado: "PENDIENTE",
  });
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const pacientesFiltrados = busqueda.length > 1
    ? pacientes.filter((p) =>
        `${p.nombre} ${p.apellido} ${p.rut}`.toLowerCase().includes(busqueda.toLowerCase())
      )
    : pacientes;

  const createHora = useMutation({
    mutationFn: async (body: {
      fecha: string;
      medicoId: string;
      pacienteId: string;
      estado: string;
    }) => {
      const res = await fetch("/api/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Error al crear la hora");
      }
      return res.json() as Promise<Hora>;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["horas"] });

      const snapshots = queryClient.getQueriesData<Hora[]>({ queryKey: ["horas"] });

      const medico = medicos.find((m) => m.id === vars.medicoId);
      const paciente = pacientes.find((p) => p.id === vars.pacienteId);
      const tempHora: Hora = {
        id: `temp-${Date.now()}`,
        fecha: vars.fecha,
        estado: vars.estado as EstadoHora,
        medicoId: vars.medicoId,
        medico: {
          id: vars.medicoId,
          especialidad: medico?.especialidad ?? "",
          usuario: { nombre: medico?.usuario.nombre ?? "" },
        },
        pacienteId: vars.pacienteId,
        paciente: {
          id: vars.pacienteId,
          nombre: paciente?.nombre ?? "",
          apellido: paciente?.apellido ?? "",
          rut: paciente?.rut ?? "",
        },
      };

      queryClient.setQueriesData<Hora[]>({ queryKey: ["horas"] }, (old) =>
        old ? [...old, tempHora] : [tempHora],
      );

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      setError(createHora.error?.message ?? "Error al crear la hora");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["horas"] });
    },
    onSuccess: () => {
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!form.pacienteId) { setError("Selecciona un paciente"); return; }
    if (!form.medicoId) { setError("Selecciona un médico"); return; }

    const [year, month, day] = form.fecha.split("-").map(Number);
    const [hours, minutes] = form.hora.split(":").map(Number);
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, hours + 4, minutes));

    createHora.mutate({
      fecha: fechaUTC.toISOString(),
      medicoId: form.medicoId,
      pacienteId: form.pacienteId,
      estado: form.estado,
    });
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nueva hora</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Hora</label>
              <input
                type="time"
                value={form.hora}
                step={1800}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Médico</label>
            <select
              value={form.medicoId}
              onChange={(e) => setForm((f) => ({ ...f, medicoId: e.target.value }))}
              className={inputClass}
              required
            >
              {medicos.length === 0 && <option value="">No hay médicos registrados</option>}
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.usuario.nombre} — {m.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Paciente</label>
            <input
              type="search"
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={inputClass}
            />
            <select
              value={form.pacienteId}
              onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}
              className={inputClass}
              required
              size={pacientesFiltrados.length > 0 ? Math.min(pacientesFiltrados.length + 1, 6) : 2}
            >
              <option value="">Seleccionar paciente...</option>
              {pacientesFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} ({p.rut})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              className={inputClass}
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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
              disabled={createHora.isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {createHora.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
