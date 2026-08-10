import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { NuevoMedicoForm } from "@/components/medicos/nuevo-medico-form";
import { authOptions } from "@/lib/auth";

export default async function NuevoMedicoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

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
      <NuevoMedicoForm />
    </main>
  );
}
