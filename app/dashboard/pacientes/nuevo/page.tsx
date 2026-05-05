import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function NuevoPacientePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
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
          <h1 className="text-lg font-semibold tracking-tight">Nuevo paciente</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Completa los datos del paciente. Los campos marcados con * son
            obligatorios.
          </p>

          <form className="mt-6 grid gap-5" action="#">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  RUT <span className="text-red-600">*</span>
                </span>
                <input
                  name="rut"
                  type="text"
                  placeholder="12.345.678-9"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Teléfono <span className="text-red-600">*</span>
                </span>
                <input
                  name="telefono"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Nombre <span className="text-red-600">*</span>
                </span>
                <input
                  name="nombre"
                  type="text"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Apellido <span className="text-red-600">*</span>
                </span>
                <input
                  name="apellido"
                  type="text"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Email (opcional)</span>
                <input
                  name="email"
                  type="email"
                  placeholder="paciente@email.cl"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">
                  Fecha de nacimiento (opcional)
                </span>
                <input
                  name="fechaNac"
                  type="date"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Guardar
              </button>
              <Link
                href="/dashboard/pacientes"
                className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
