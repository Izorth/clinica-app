"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useCallback, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      setLoading(false);

      if (result?.error) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    },
    [callbackUrl, email, password, router],
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-[--color-bg] px-4 py-16 dark:bg-stone-950">
      <div className="w-full max-w-sm rounded-lg border border-[--color-border-stone] bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h1 className="text-[18px] font-semibold tracking-tight text-[--color-text] dark:text-stone-50">
          Iniciar sesión
        </h1>
        <p className="mt-1.5 text-[13px] text-[--color-text-muted]">
          Usa tu correo y contraseña institucional.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[--color-text-muted]">
              Email
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[6px] border border-[--color-border-strong] bg-white px-3 py-2 text-[14px] text-[--color-text] outline-none transition-shadow focus:border-[--color-brand] focus:ring-3 focus:ring-[--color-brand-subtle] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[--color-text-muted]">
              Contraseña
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-[6px] border border-[--color-border-strong] bg-white px-3 py-2 text-[14px] text-[--color-text] outline-none transition-shadow focus:border-[--color-brand] focus:ring-3 focus:ring-[--color-brand-subtle] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            />
          </label>

          {error ? (
            <p className="text-[13px] text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-9 items-center justify-center rounded-[6px] bg-[--color-brand] text-[13px] font-medium text-white transition-colors hover:bg-[--color-brand-hover] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
