import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

type PacienteDetalle = {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaNac: string;
  historial: { fecha: string; diagnostico: string; notas: string }[];
  horas: { fecha: string; hora: string; medico: string; estado: string }[];
};

const pacientes: PacienteDetalle[] = [
  {
    id: "p-001",
    rut: "12.345.678-9",
    nombre: "María",
    apellido: "González",
    telefono: "+56 9 9123 4567",
    email: "maria.gonzalez@email.cl",
    fechaNac: "1990-07-14",
    historial: [
      {
        fecha: "2026-04-10",
        diagnostico: "Control general",
        notas: "Paciente estable, se indica control en 3 meses.",
      },
      {
        fecha: "2026-02-02",
        diagnostico: "Dolor lumbar",
        notas: "Se prescribe reposo y antiinflamatorio por 5 días.",
      },
    ],
    horas: [
      {
        fecha: "2026-05-06",
        hora: "09:00",
        medico: "Dr. Carlos Ruiz",
        estado: "CONFIRMADA",
      },
      {
        fecha: "2026-05-20",
        hora: "10:30",
        medico: "Dra. Ana Martínez",
        estado: "PENDIENTE",
      },
    ],
  },
  {
    id: "p-002",
    rut: "14.567.890-1",
    nombre: "Pedro",
    apellido: "Soto",
    telefono: "+56 9 8765 4321",
    email: "pedro.soto@email.cl",
    fechaNac: "1986-01-22",
    historial: [
      {
        fecha: "2026-03-16",
        diagnostico: "Control cardiológico",
        notas: "Sin hallazgos relevantes, continuar tratamiento habitual.",
      },
    ],
    horas: [
      {
        fecha: "2026-05-07",
        hora: "11:15",
        medico: "Dr. Tomás Herrera",
        estado: "CONFIRMADA",
      },
    ],
  },
];

function estadoClass(estado: string) {
  if (estado === "CONFIRMADA") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/30";
  }
  return "bg-amber-50 text-amber-900 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/30";
}

export default async function PacienteFichaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;
  const paciente = pacientes.find((p) => p.id === id);
  if (!paciente) {
    notFound();
  }

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/pacientes"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Volver a pacientes
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>

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
              {paciente.email}
            </p>
            <p>
              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                Fecha de nacimiento:
              </span>{" "}
              {paciente.fechaNac}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Historial de fichas médicas</h2>
            <button
              type="button"
              className="inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Agregar nueva ficha médica
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {paciente.historial.map((ficha) => (
              <article
                key={`${ficha.fecha}-${ficha.diagnostico}`}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {ficha.fecha}
                </p>
                <p className="mt-1 text-sm font-semibold">{ficha.diagnostico}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {ficha.notas}
                </p>
              </article>
            ))}
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
                {paciente.horas.map((hora) => (
                  <tr key={`${hora.fecha}-${hora.hora}-${hora.medico}`}>
                    <td className="px-2 py-3">{hora.fecha}</td>
                    <td className="px-2 py-3">{hora.hora}</td>
                    <td className="px-2 py-3">{hora.medico}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoClass(hora.estado)}`}
                      >
                        {hora.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
