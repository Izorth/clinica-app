import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/nav";
import { MedicoDetalle } from "@/components/medicos/medico-detalle";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MedicoDetallePage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  const medicoDb = await prisma.medico.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
      horas: {
        include: {
          paciente: { select: { nombre: true, apellido: true } },
        },
        orderBy: { fecha: "desc" },
        take: 5,
      },
    },
  });

  if (!medicoDb) {
    notFound();
  }

  const medico = JSON.parse(JSON.stringify(medicoDb));

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <DashboardNav />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/medicos"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Volver a médicos
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>

        <MedicoDetalle medico={medico} />
      </main>
    </div>
  );
}
