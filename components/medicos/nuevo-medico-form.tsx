"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MedicoInput = {
  nombre: string;
  email: string;
  password: string;
  especialidad: string;
};

export function NuevoMedicoForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMedico = useMutation({
    mutationFn: async (data: MedicoInput) => {
      const res = await fetch("/api/medicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? "Error al guardar el médico");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicos"] });
      router.push("/dashboard/medicos");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem("nombre") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const especialidad = (form.elements.namedItem("especialidad") as HTMLInputElement).value.trim();

    if (password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("El email no es válido");
      return;
    }
    createMedico.mutate({ nombre, email, password, especialidad });
  }

  const errorMsg = validationError ?? (createMedico.isError ? createMedico.error.message : null);

  const inputClass =
    "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none transition-all duration-150 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold tracking-tight">Nuevo médico</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Completa los datos del médico. Los campos marcados con * son obligatorios.
      </p>

      {errorMsg && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {errorMsg}
        </p>
      )}

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Nombre completo <span className="text-red-600">*</span>
            </span>
            <input name="nombre" type="text" required className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Especialidad <span className="text-red-600">*</span>
            </span>
            <input
              name="especialidad"
              type="text"
              placeholder="ej: Medicina General"
              required
              className={inputClass}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium">
            Email <span className="text-red-600">*</span>
          </span>
          <input
            name="email"
            type="email"
            placeholder="medico@clinica.cl"
            required
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">
            Contraseña <span className="text-red-600">*</span>
          </span>
          <input
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            className={inputClass}
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createMedico.isPending}
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {createMedico.isPending ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href="/dashboard/medicos"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
