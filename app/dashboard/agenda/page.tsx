export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { AgendaContent } from "@/components/agenda/agenda-content";
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

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [medicos, pacientes, horasDb] = await Promise.all([
    prisma.medico.findMany({
      include: { usuario: { select: { nombre: true } } },
      orderBy: { usuario: { nombre: "asc" } },
    }),
    prisma.paciente.findMany({
      select: { id: true, nombre: true, apellido: true, rut: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.hora.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } },
      include: {
        medico: { include: { usuario: { select: { nombre: true } } } },
        paciente: { select: { id: true, nombre: true, apellido: true, rut: true } },
      },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const nombre = session.user.name ?? session.user.email ?? "Usuario";
  const rol = session.user.rol ? rolLabel(session.user.rol) : "—";

  // Serialize Dates to strings for client components
  const horasIniciales = JSON.parse(JSON.stringify(horasDb));

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Agenda de citas
            </p>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Hola, {nombre}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Rol:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{rol}</span>
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <DashboardNav />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <AgendaContent
          medicos={medicos}
          pacientes={pacientes}
          horasIniciales={horasIniciales}
        />
      </main>
    </div>
  );
}
