"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { validarRut } from "@/lib/utils/rut";

type PacienteInput = {
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  fechaNac: string | null;
};

export function NuevoPacienteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rutError, setRutError] = useState<string | null>(null);

  const createPaciente = useMutation({
    mutationFn: async (data: PacienteInput) => {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? "Error al guardar el paciente");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      router.push("/dashboard/pacientes");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const rut = (form.elements.namedItem("rut") as HTMLInputElement).value.trim();
    if (!validarRut(rut)) {
      setRutError("El RUT no es válido: revisa el dígito verificador.");
      return;
    }
    setRutError(null);

    createPaciente.mutate({
      rut,
      nombre: (form.elements.namedItem("nombre") as HTMLInputElement).value.trim(),
      apellido: (form.elements.namedItem("apellido") as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem("telefono") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim() || null,
      fechaNac: (form.elements.namedItem("fechaNac") as HTMLInputElement).value || null,
    });
  }

  const inputClass =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold tracking-tight">Nuevo paciente</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Completa los datos del paciente. Los campos marcados con * son obligatorios.
      </p>

      {(rutError || createPaciente.isError) && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {rutError ?? createPaciente.error?.message}
        </p>
      )}

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              RUT <span className="text-red-600">*</span>
            </span>
            <input name="rut" type="text" placeholder="12.345.678-5" required className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Teléfono <span className="text-red-600">*</span>
            </span>
            <input name="telefono" type="tel" placeholder="+56 9 1234 5678" required className={inputClass} />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Nombre <span className="text-red-600">*</span>
            </span>
            <input name="nombre" type="text" required className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Apellido <span className="text-red-600">*</span>
            </span>
            <input name="apellido" type="text" required className={inputClass} />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Email (opcional)</span>
            <input name="email" type="email" placeholder="paciente@email.cl" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Fecha de nacimiento (opcional)</span>
            <input name="fechaNac" type="date" className={inputClass} />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createPaciente.isPending}
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {createPaciente.isPending ? "Guardando..." : "Guardar"}
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
  );
}
