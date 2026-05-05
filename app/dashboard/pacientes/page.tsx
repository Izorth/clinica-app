import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { PacientesList } from "@/components/pacientes/pacientes-list";
import { authOptions } from "@/lib/auth";

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    MEDICO: "Médico",
    RECEPCIONISTA: "Recepcionista",
  };
  return labels[rol] ?? rol;
}

const pacientes = [
  {
    id: "p-001",
    rut: "12.345.678-9",
    nombre: "María",
    apellido: "González",
    telefono: "+56 9 9123 4567",
    email: "maria.gonzalez@email.cl",
  },
  {
    id: "p-002",
    rut: "14.567.890-1",
    nombre: "Pedro",
    apellido: "Soto",
    telefono: "+56 9 8765 4321",
    email: "pedro.soto@email.cl",
  },
  {
    id: "p-003",
    rut: "17.234.567-4",
    nombre: "Laura",
    apellido: "Fuentes",
    telefono: "+56 9 7123 9876",
    email: "laura.fuentes@email.cl",
  },
  {
    id: "p-004",
    rut: "19.876.543-2",
    nombre: "Jorge",
    apellido: "Valdés",
    telefono: "+56 9 6987 1122",
    email: "jorge.valdes@email.cl",
  },
] as const;

export default async function PacientesPage() {
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
              Gestión de pacientes
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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Volver al dashboard
          </Link>
          <Link
            href="/dashboard/pacientes/nuevo"
            className="inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Nuevo Paciente
          </Link>
        </div>

        <PacientesList pacientes={[...pacientes]} />
      </main>
    </div>
  );
}
