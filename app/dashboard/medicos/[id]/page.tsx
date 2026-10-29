import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";

import { MedicoDetalle } from "@/components/medicos/medico-detalle";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MedicoDetallePage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await props.params;

  // Mismo criterio que GET /api/medicos/[id]: el directorio es para todo el
  // staff, pero la agenda (horas + nombres de pacientes) de un médico solo la
  // ve ADMIN/RECEPCIONISTA o el propio médico — esta página renderiza server-
  // side con su propia query y no pasa por esa ruta, así que necesita el
  // mismo chequeo acá.
  let medicoIdPropio: string | null = null;
  if (session.user.rol === "MEDICO") {
    const propio = await prisma.medico.findUnique({
      where: { usuarioId: session.user.id },
      select: { id: true },
    });
    medicoIdPropio = propio?.id ?? null;
  }
  const puedeVerAgenda =
    session.user.rol === "ADMIN" || session.user.rol === "RECEPCIONISTA" || medicoIdPropio === id;

  const medicoDb = await prisma.medico.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
      ...(puedeVerAgenda
        ? {
            horas: {
              include: { paciente: { select: { nombre: true, apellido: true } } },
              orderBy: { fecha: "desc" as const },
              take: 5,
            },
          }
        : {}),
    },
  });

  if (!medicoDb) notFound();

  const medico = JSON.parse(JSON.stringify({ ...medicoDb, horas: medicoDb.horas ?? [] }));

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/medicos"
          className="inline-flex items-center rounded-[6px] border border-[var(--color-border-stone)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          ← Volver a médicos
        </Link>
      </div>
      <MedicoDetalle medico={medico} />
    </main>
  );
}
