"use client";

import { useCallback, useEffect, useState } from "react";

import { supabaseClient } from "@/lib/supabase-client";
import type { EstadoHora, Hora } from "./hora-card";
import { NuevaHoraModal } from "./nueva-hora-modal";
import { VistaMensual } from "./vista-mensual";
import { VistaSemanal } from "./vista-semanal";

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

type AgendaContentProps = {
  medicos: Medico[];
  pacientes: Paciente[];
  horasIniciales: Hora[];
};

type Vista = "semanal" | "mensual";

const ESTADO_LABELS: Record<EstadoHora, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};

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

export function AgendaContent({ medicos, pacientes, horasIniciales }: AgendaContentProps) {
  const [vista, setVista] = useState<Vista>("semanal");
  const [fechaBase, setFechaBase] = useState(new Date());
  const [horas, setHoras] = useState<Hora[]>(horasIniciales);
  const [loading, setLoading] = useState(false);

  const [nuevoSlot, setNuevoSlot] = useState<Date | null>(null);
  const [selectedHora, setSelectedHora] = useState<Hora | null>(null);
  const [estadoEditando, setEstadoEditando] = useState<string>("");
  const [accionLoading, setAccionLoading] = useState(false);
  const [accionError, setAccionError] = useState("");

  const [medicoFiltro, setMedicoFiltro] = useState("todos");

  const fetchHoras = useCallback(async (inicio: Date, fin: Date, medicoId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      });
      if (medicoId) params.set("medicoId", medicoId);
      const res = await fetch(`/api/horas?${params}`);
      if (res.ok) {
        setHoras(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function filtroId(filtro: string) {
    return filtro !== "todos" ? filtro : undefined;
  }

  useEffect(() => {
    const [inicio, fin] =
      vista === "semanal" ? getWeekRange(fechaBase) : getMonthRange(fechaBase);

    const channel = supabaseClient
      .channel("horas-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Hora" },
        (payload) => {
          setHoras((prev) =>
            prev.map((h) =>
              h.id === payload.new.id ? { ...h, estado: payload.new.estado as EstadoHora } : h
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Hora" },
        () => {
          fetchHoras(inicio, fin, filtroId(medicoFiltro));
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fechaBase, vista, medicoFiltro, fetchHoras]);

  function navigate(delta: number) {
    const newBase = new Date(fechaBase);
    if (vista === "semanal") {
      newBase.setDate(newBase.getDate() + delta * 7);
    } else {
      newBase.setMonth(newBase.getMonth() + delta);
    }
    setFechaBase(newBase);
    const [inicio, fin] = vista === "semanal" ? getWeekRange(newBase) : getMonthRange(newBase);
    fetchHoras(inicio, fin, filtroId(medicoFiltro));
  }

  function navigateToday() {
    const today = new Date();
    setFechaBase(today);
    const [inicio, fin] = vista === "semanal" ? getWeekRange(today) : getMonthRange(today);
    fetchHoras(inicio, fin, filtroId(medicoFiltro));
  }

  function changeVista(v: Vista) {
    setVista(v);
    const [inicio, fin] = v === "semanal" ? getWeekRange(fechaBase) : getMonthRange(fechaBase);
    fetchHoras(inicio, fin, filtroId(medicoFiltro));
  }

  function handleMedicoFiltro(value: string) {
    setMedicoFiltro(value);
    const [inicio, fin] = vista === "semanal" ? getWeekRange(fechaBase) : getMonthRange(fechaBase);
    fetchHoras(inicio, fin, filtroId(value));
  }

  function openHoraDetail(hora: Hora) {
    setSelectedHora(hora);
    setEstadoEditando(hora.estado);
    setAccionError("");
  }

  async function handleEstadoChange() {
    if (!selectedHora || estadoEditando === selectedHora.estado) return;
    setAccionLoading(true);
    setAccionError("");
    try {
      const res = await fetch(`/api/horas/${selectedHora.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estadoEditando }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAccionError(data.error ?? "Error al actualizar");
        return;
      }
      const updated: Hora = await res.json();
      setHoras((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      setSelectedHora(updated);
    } finally {
      setAccionLoading(false);
    }
  }

  async function handleEliminar() {
    if (!selectedHora) return;
    if (!confirm("¿Eliminar esta hora? Esta acción no se puede deshacer.")) return;
    setAccionLoading(true);
    setAccionError("");
    try {
      const res = await fetch(`/api/horas/${selectedHora.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setAccionError(data.error ?? "Error al eliminar");
        return;
      }
      setHoras((prev) => prev.filter((h) => h.id !== selectedHora.id));
      setSelectedHora(null);
    } finally {
      setAccionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={medicoFiltro}
            onChange={(e) => handleMedicoFiltro(e.target.value)}
            className="min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
          {loading && (
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
      {nuevoSlot && (
        <NuevaHoraModal
          fechaInicial={nuevoSlot}
          medicos={medicos}
          pacientes={pacientes}
          onClose={() => setNuevoSlot(null)}
          onSave={(nueva) => {
            setHoras((prev) => [...prev, nueva]);
            setNuevoSlot(null);
          }}
        />
      )}

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
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {(Object.keys(ESTADO_LABELS) as EstadoHora[]).map((k) => (
                      <option key={k} value={k}>
                        {ESTADO_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleEstadoChange}
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
