"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { useHoras } from "@/lib/hooks/useHoras";
import { useMedicos } from "@/lib/hooks/useMedicos";
import { usePacientes } from "@/lib/hooks/usePacientes";
import { supabaseClient } from "@/lib/supabase-client";
import { type EstadoHora, ESTADO_LABELS } from "@/lib/utils/estados";

import type { Hora } from "./hora-card";
import { NuevaHoraModal } from "./nueva-hora-modal";
import { VistaMensual } from "./vista-mensual";
import { VistaSemanal } from "./vista-semanal";

type Vista = "semanal" | "mensual";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekRange(base: Date): [Date, Date] {
  const lunes = getMonday(base);
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return [lunes, domingo];
}

function getMonthRange(base: Date): [Date, Date] {
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fin = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return [inicio, fin];
}

function periodoLabel(vista: Vista, fechaBase: Date): string {
  if (vista === "semanal") {
    const lunes = getMonday(fechaBase);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const a = lunes.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
    const b = domingo.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
    return `${a} – ${b}`;
  }
  return fechaBase.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export function AgendaContent() {
  const queryClient = useQueryClient();

  const [vista, setVista] = useState<Vista>("semanal");
  const [fechaBase, setFechaBase] = useState(new Date());
  const [medicoFiltro, setMedicoFiltro] = useState("todos");

  const [nuevoSlot, setNuevoSlot] = useState<Date | null>(null);
  const [selectedHora, setSelectedHora] = useState<Hora | null>(null);
  const [estadoEditando, setEstadoEditando] = useState<string>("");
  const [accionError, setAccionError] = useState("");

  const [inicio, fin] =
    vista === "semanal" ? getWeekRange(fechaBase) : getMonthRange(fechaBase);

  const horasParams = {
    fechaInicio: inicio.toISOString(),
    fechaFin: fin.toISOString(),
    ...(medicoFiltro !== "todos" ? { medicoId: medicoFiltro } : {}),
  };

  const { data: horas = [], isFetching } = useHoras(horasParams);
  const { data: medicos = [] } = useMedicos();
  const { data: pacientes = [] } = usePacientes();

  // Invalidate on realtime events from Supabase
  useEffect(() => {
    const channel = supabaseClient
      .channel("agenda-hora-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Hora" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["horas"] });
        },
      )
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);

  function navigate(delta: number) {
    setFechaBase((prev) => {
      const next = new Date(prev);
      if (vista === "semanal") next.setDate(next.getDate() + delta * 7);
      else next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  function navigateToday() {
    setFechaBase(new Date());
  }

  function changeVista(v: Vista) {
    setVista(v);
  }

  function openHoraDetail(hora: Hora) {
    setSelectedHora(hora);
    setEstadoEditando(hora.estado);
    setAccionError("");
  }

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const res = await fetch(`/api/horas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Error al actualizar");
      }
      return res.json() as Promise<Hora>;
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["horas"] });
      setSelectedHora(updated);
    },
    onError: (err: Error) => {
      setAccionError(err.message);
    },
  });

  const deleteHora = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/horas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? "Error al eliminar");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["horas"] });
      setSelectedHora(null);
    },
    onError: (err: Error) => {
      setAccionError(err.message);
    },
  });

  async function handleEliminar() {
    if (!selectedHora) return;
    if (!confirm("¿Eliminar esta hora? Esta acción no se puede deshacer.")) return;
    deleteHora.mutate(selectedHora.id);
  }

  const accionLoading = updateEstado.isPending || deleteHora.isPending;

  // Medicos formatted for the filter/modal (subset of full type)
  const medicosSimple = medicos.map((m) => ({
    id: m.id,
    especialidad: m.especialidad,
    usuario: { nombre: m.usuario.nombre },
  }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={medicoFiltro}
            onChange={(e) => setMedicoFiltro(e.target.value)}
            className="min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="todos">Todos los médicos</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                Dr. {m.usuario.nombre} — {m.especialidad}
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ‹
          </button>
          <button
            onClick={navigateToday}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hoy
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ›
          </button>
          <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
            {periodoLabel(vista, fechaBase)}
          </span>
          {isFetching && (
            <span className="text-xs text-zinc-400">Cargando...</span>
          )}
        </div>

        {/* Vista toggle */}
        <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
          {(["semanal", "mensual"] as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => changeVista(v)}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                vista === v
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {vista === "semanal" ? (
          <VistaSemanal
            horas={horas}
            fechaBase={fechaBase}
            onSlotClick={setNuevoSlot}
            onHoraClick={openHoraDetail}
          />
        ) : (
          <VistaMensual
            horas={horas}
            fechaBase={fechaBase}
            onSlotClick={setNuevoSlot}
            onHoraClick={openHoraDetail}
          />
        )}
      </div>

      {/* Nueva hora modal */}
      <AnimatePresence>
        {nuevoSlot && (
          <NuevaHoraModal
            fechaInicial={nuevoSlot}
            medicos={medicosSimple}
            pacientes={pacientes}
            onClose={() => setNuevoSlot(null)}
          />
        )}
      </AnimatePresence>

      {/* Detalle hora modal */}
      {selectedHora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Detalle de hora
              </h2>
              <button
                onClick={() => setSelectedHora(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Fecha y hora</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(selectedHora.fecha).toLocaleDateString("es-CL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {" · "}
                  {new Date(selectedHora.fecha).toLocaleTimeString("es-CL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Paciente</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedHora.paciente.nombre} {selectedHora.paciente.apellido}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedHora.paciente.rut}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Médico</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedHora.medico.usuario.nombre}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedHora.medico.especialidad}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Estado</p>
                <div className="flex items-center gap-2">
                  <select
                    value={estadoEditando}
                    onChange={(e) => setEstadoEditando(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {(Object.keys(ESTADO_LABELS) as EstadoHora[]).map((k) => (
                      <option key={k} value={k}>
                        {ESTADO_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      updateEstado.mutate({ id: selectedHora.id, estado: estadoEditando })
                    }
                    disabled={accionLoading || estadoEditando === selectedHora.estado}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              {accionError && (
                <p className="text-sm text-red-600 dark:text-red-400">{accionError}</p>
              )}

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <button
                  onClick={handleEliminar}
                  disabled={accionLoading}
                  className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Eliminar hora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
