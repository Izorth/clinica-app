import Link from "next/link";

import { PacientesLoader } from "@/components/pacientes/pacientes-loader";

export default function PacientesPage() {
  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-[var(--color-text)]">Pacientes</h1>
        <Link
          href="/dashboard/pacientes/nuevo"
          className="inline-flex items-center rounded-[6px] bg-[var(--color-text)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 dark:bg-stone-100 dark:text-stone-900"
        >
          + Nuevo paciente
        </Link>
      </div>
      <PacientesLoader />
    </main>
  );
}
