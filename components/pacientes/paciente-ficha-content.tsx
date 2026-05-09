"use client";

import { useEffect, useState } from "react";


type Ficha = {
  id: string;
  diagnostico: string;
  tratamiento: string | null;
  notas: string | null;
  creadoEn: string;
};

type Hora = {
  id: string;
  fecha: string;
  estado: string;
  medico: {
    usuario: {
      nombre: string;
    };
  };
};

type PacienteDetalle = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  fechaNac: string | null;
  fichas: Ficha[];
  horas: Hora[];
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHora(iso: string) {
  const d = new Date(iso);
  const s = new Date(d.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  return `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`;
}

function estadoClass(estado: string) {
  if (estado === "CONFIRMADA") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/30";
  }
  return "bg-amber-50 text-amber-900 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/30";
}

export function PacienteFichaContent({ id }: { id: string }) {
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horasAgendadas, setHorasAgendadas] = useState<Hora[]>([]);
  const [recordatorioLoading, setRecordatorioLoading] = useState(false);
  const [recordatorioMsg, setRecordatorioMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  async function enviarRecordatorio() {
    setRecordatorioLoading(true);
    setRecordatorioMsg(null);
    try {
      const res = await fetch(`/api/pacientes/${id}/recordatorio`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setRecordatorioMsg({ ok: true, text: "Recordatorio enviado por WhatsApp" });
      } else {
        setRecordatorioMsg({ ok: false, text: data.error ?? "Error al enviar" });
      }
    } catch {
      setRecordatorioMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setRecordatorioLoading(false);
    }
  }

  useEffect(() => {
    fetch(`/api/pacientes/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Paciente no encontrado");
        if (!res.ok) throw new Error("Error al cargar el paciente");
        return res.json() as Promise<PacienteDetalle>;
      })
      .then((data) => {
        setPaciente(data);
        setHorasAgendadas(data.horas);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/pacientes/${id}`)
        .then((res) => (res.ok ? (res.json() as Promise<{ horas: Hora[] }>) : null))
        .then((data) => { if (data) setHorasAgendadas(data.horas); })
        .catch(() => undefined);
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando ficha...
        </p>
      </section>
    );
  }

  if (error || !paciente) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Paciente no encontrado"}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight">
          Ficha de {paciente.nombre} {paciente.apellido}
        </h1>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              RUT:
            </span>{" "}
            {paciente.rut}
          </p>
          <p>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              Teléfono:
            </span>{" "}
            {paciente.telefono}
          </p>
          <p>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              Email:
            </span>{" "}
            {paciente.email ?? "—"}
          </p>
          <p>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              Fecha de nacimiento:
            </span>{" "}
            {paciente.fechaNac ? formatFecha(paciente.fechaNac) : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            Historial de fichas médicas
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enviarRecordatorio}
              disabled={recordatorioLoading || !paciente.telefono}
              className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              {recordatorioLoading ? "Enviando..." : "📱 Enviar recordatorio"}
            </button>
            <button
              type="button"
              className="inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Agregar nueva ficha médica
            </button>
          </div>
        </div>
        {recordatorioMsg && (
          <p
            className={`mt-2 text-sm ${recordatorioMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {recordatorioMsg.text}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {paciente.fichas.length > 0 ? (
            paciente.fichas.map((ficha) => (
              <article
                key={ficha.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {formatFecha(ficha.creadoEn)}
                </p>
                <p className="mt-1 text-sm font-semibold">{ficha.diagnostico}</p>
                {ficha.notas && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {ficha.notas}
                  </p>
                )}
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sin fichas registradas.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Horas agendadas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-2 py-2 font-semibold">Fecha</th>
                <th className="px-2 py-2 font-semibold">Hora</th>
                <th className="px-2 py-2 font-semibold">Médico</th>
                <th className="px-2 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {horasAgendadas.length > 0 ? (
                horasAgendadas.map((hora) => (
                  <tr key={hora.id}>
                    <td className="px-2 py-3">{formatFecha(hora.fecha)}</td>
                    <td className="px-2 py-3">{formatHora(hora.fecha)}</td>
                    <td className="px-2 py-3">{hora.medico.usuario.nombre}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoClass(hora.estado)}`}
                      >
                        {hora.estado}
                      </span>
                    </td>
                  </tr>
                ))
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
