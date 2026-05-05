import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { authOptions } from "@/lib/auth";

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    MEDICO: "Médico",
    RECEPCIONISTA: "Recepcionista",
  };
  return labels[rol] ?? rol;
}

const summaryCards = [
  { title: "Total Pacientes", value: "1.248", hint: "+12 esta semana" },
  { title: "Horas de Hoy", value: "18", hint: "6 confirmadas" },
  { title: "Horas Pendientes", value: "7", hint: "Requieren confirmación" },
  { title: "Ingresos del Mes", value: "$4.2M", hint: "Mayo 2026" },
] as const;

const proximasHoras = [
  {
    hora: "09:00",
    paciente: "María González",
    medico: "Dr. Carlos Ruiz",
    estado: "CONFIRMADA",
  },
  {
    hora: "09:30",
    paciente: "Pedro Soto",
    medico: "Dra. Ana Martínez",
    estado: "PENDIENTE",
  },
  {
    hora: "10:15",
    paciente: "Laura Fuentes",
    medico: "Dr. Carlos Ruiz",
    estado: "CONFIRMADA",
  },
  {
    hora: "11:00",
    paciente: "Jorge Valdés",
    medico: "Dr. Tomás Herrera",
    estado: "PENDIENTE",
  },
  {
    hora: "11:45",
    paciente: "Carmen Díaz",
    medico: "Dra. Ana Martínez",
    estado: "CONFIRMADA",
  },
] as const;

function estadoBadgeClass(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/30";
    case "PENDIENTE":
      return "bg-amber-50 text-amber-900 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-500/30";
    default:
      return "bg-zinc-100 text-zinc-800 ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-200";
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const nombre = session.user.name ?? session.user.email ?? "Usuario";
  const rol = session.user.rol ? rolLabel(session.user.rol) : "—";

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Panel clínico
            </p>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Hola, {nombre}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Rol:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {rol}
              </span>
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Resumen
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Indicadores de ejemplo; luego se conectarán a la base de datos.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <li
                key={card.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {card.hint}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Próximas horas del día
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Agenda de muestra para hoy.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      Hora
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      Paciente
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      Médico
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {proximasHoras.map((row) => (
                    <tr
                      key={`${row.hora}-${row.paciente}`}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                        {row.hora}
                      </td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {row.paciente}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {row.medico}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoBadgeClass(row.estado)}`}
                        >
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
