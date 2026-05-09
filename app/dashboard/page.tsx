export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
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
    agendaHoyDb,
  ] = await Promise.all([
    prisma.paciente.count().catch(() => 0),
    prisma.paciente.count({ where: { creadoEn: { gte: hace7dias } } }).catch(() => 0),
    prisma.hora.count({ where: { fecha: { gte: inicioHoy, lt: finHoy } } }).catch(() => 0),
    prisma.hora.count({ where: { fecha: { gte: inicioHoy, lt: finHoy }, estado: "CONFIRMADA" } }).catch(() => 0),
    prisma.hora.count({ where: { estado: "PENDIENTE" } }).catch(() => 0),
    prisma.pago
      .aggregate({ _sum: { monto: true }, where: { estado: "PAGADO", creadoEn: { gte: inicioMes, lte: finMes } } })
      .catch(() => null),
    prisma.hora
      .findMany({
        where: { fecha: { gte: inicioHoy, lt: finHoy } },
        include: {
          paciente: { select: { nombre: true, apellido: true } },
          medico: { include: { usuario: { select: { nombre: true } } } },
        },
        orderBy: { fecha: "asc" },
        take: 10,
      })
      .catch(() => []),
  ]);

  const ingresosMes = pagosMes?._sum?.monto ?? 0;
  const mesLabel = hoy.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const fechaLabel = hoy.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
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
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Hola, {nombre}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Rol:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{rol}</span>
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <DashboardNav />

      <DashboardContent
        totalPacientes={totalPacientes}
        pacientesEstaSemana={pacientesEstaSemana}
        horasHoy={horasHoy}
        horasHoyConfirmadas={horasHoyConfirmadas}
        horasPendientes={horasPendientes}
        ingresosMes={ingresosMes}
        mesLabel={mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
        fechaLabel={fechaLabel}
        agendaHoy={JSON.parse(JSON.stringify(agendaHoyDb))}
      />
    </div>
  );
}
