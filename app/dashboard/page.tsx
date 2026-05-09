import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    MEDICO: "Médico",
    RECEPCIONISTA: "Recepcionista",
  };
  return labels[rol] ?? rol;
}

function formatMonto(monto: number): string {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `$${Math.round(monto / 1_000)}K`;
  return `$${monto.toLocaleString("es-CL")}`;
}

function estadoBadgeClass(estado: string) {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-green-100 text-green-800 ring-green-600/20 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-500/30";
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-950/50 dark:text-yellow-200 dark:ring-yellow-500/30";
    case "CANCELADA":
      return "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-500/30";
    default:
      return "bg-zinc-100 text-zinc-600 ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const ahora = new Date();
  const hoy = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const inicioHoy = new Date(
    Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 4, 0, 0)
  );
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
  const hace7dias = new Date(inicioHoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    totalPacientes,
    pacientesEstaSemana,
    horasHoy,
    horasHoyConfirmadas,
    horasPendientes,
    pagosMes,
    agendaHoy,
  ] = await Promise.all([
    prisma.paciente.count().catch(() => 0),
    prisma.paciente.count({ where: { creadoEn: { gte: hace7dias } } }).catch(() => 0),
    prisma.hora.count({ where: { fecha: { gte: inicioHoy, lt: finHoy } } }).catch(() => 0),
    prisma.hora.count({ where: { fecha: { gte: inicioHoy, lt: finHoy }, estado: "CONFIRMADA" } }).catch(() => 0),
    prisma.hora.count({ where: { estado: "PENDIENTE" } }).catch(() => 0),
    prisma.pago.aggregate({ _sum: { monto: true }, where: { estado: "PAGADO", creadoEn: { gte: inicioMes, lte: finMes } } }).catch(() => null),
    prisma.hora.findMany({
      where: { fecha: { gte: inicioHoy, lt: finHoy } },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        medico: { include: { usuario: { select: { nombre: true } } } },
      },
      orderBy: { fecha: "asc" },
      take: 10,
    }).catch(() => []),
  ]);

  const ingresosMes = pagosMes?._sum?.monto ?? 0;
  const mesLabel = hoy.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const mesCapitalizado = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  const summaryCards = [
    { title: "Total Pacientes", value: totalPacientes.toString(), hint: `+${pacientesEstaSemana} esta semana` },
    { title: "Horas de Hoy", value: horasHoy.toString(), hint: `${horasHoyConfirmadas} confirmadas` },
    { title: "Horas Pendientes", value: horasPendientes.toString(), hint: "Requieren confirmación" },
    { title: "Ingresos del Mes", value: formatMonto(ingresosMes), hint: mesCapitalizado },
  ];

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

      <DashboardNav />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Resumen
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Datos en tiempo real desde la base de datos.
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
            Agenda de hoy — {hoy.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {agendaHoy.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay horas agendadas para hoy.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/50">
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Hora</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Paciente</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Médico</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {agendaHoy.map((hora) => {
                      const fecha = new Date(hora.fecha);
                      const fdSantiago = new Date(fecha.toLocaleString("en-US", { timeZone: "America/Santiago" }));
                      const hh = String(fdSantiago.getHours()).padStart(2, "0");
                      const mm = String(fdSantiago.getMinutes()).padStart(2, "0");
                      return (
                        <tr
                          key={hora.id}
                          className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                            {hh}:{mm}
                          </td>
                          <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                            {hora.paciente.nombre} {hora.paciente.apellido}
                          </td>
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                            {hora.medico.usuario.nombre}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoBadgeClass(hora.estado)}`}
                            >
                              {ESTADO_LABELS[hora.estado] ?? hora.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
