"use client";

import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";

import type { MedioPago } from "@/lib/utils/estados";
import { MEDIO_PAGO_LABELS } from "@/lib/utils/estados";
import type { Pago } from "@/lib/hooks/usePagos";

type Props = {
  onClose: () => void;
  /** If provided, creates a payment for this hora */
  horaId?: string;
  pacienteId?: string;
  /** If provided, edits an existing pago */
  pago?: Pago;
  onSuccess?: () => void;
};

const MEDIOS: MedioPago[] = ["EFECTIVO", "TRANSFERENCIA", "FLOW", "WEBPAY"];

export function PagoModal({ onClose, horaId, pacienteId, pago, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!pago;

  const [monto, setMonto]       = useState(pago?.monto.toString() ?? "");
  const [medioPago, setMedioPago] = useState<MedioPago>(pago?.medioPago ?? "EFECTIVO");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && pago) {
        const res = await fetch(`/api/pagos/${pago.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monto: Number(monto), medioPago }),
        });
        if (!res.ok) throw new Error("Error al actualizar pago");
      } else {
        const res = await fetch("/api/pagos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horaId, pacienteId, monto: Number(monto), medioPago }),
        });
        if (!res.ok) throw new Error("Error al registrar pago");
      }

      await queryClient.invalidateQueries({ queryKey: ["pagos"] });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarcarPagado() {
    if (!pago) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PAGADO" }),
      });
      if (!res.ok) throw new Error("Error al actualizar pago");
      await queryClient.invalidateQueries({ queryKey: ["pagos"] });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleIniciarFlow() {
    if (!pago) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pagos/flow/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoId: pago.id }),
      });
      const data = await res.json() as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "Error iniciando pago");
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl border border-[--color-border-stone] bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--color-border-stone] px-5 py-4 dark:border-stone-700">
          <h2 className="text-[14px] font-semibold text-[--color-text]">
            {isEdit ? "Editar pago" : "Registrar pago"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1 text-[--color-text-muted] hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[--color-text-muted]">
              Monto (CLP)
            </label>
            <input
              type="number"
              min="1"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="25000"
              className="w-full rounded-[6px] border border-[--color-border-stone] bg-white px-3 py-2 font-mono text-[14px] text-[--color-text] placeholder-stone-400 focus:border-[--color-brand] focus:outline-none dark:border-stone-700 dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[--color-text-muted]">
              Medio de pago
            </label>
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value as MedioPago)}
              className="w-full rounded-[6px] border border-[--color-border-stone] bg-white px-3 py-2 text-[14px] text-[--color-text] focus:border-[--color-brand] focus:outline-none dark:border-stone-700 dark:bg-stone-800"
            >
              {MEDIOS.map((m) => (
                <option key={m} value={m}>{MEDIO_PAGO_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-[6px] bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[6px] bg-[--color-brand] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar"}
            </button>

            {isEdit && pago?.estado === "PENDIENTE" && (
              <>
                {pago.medioPago === "FLOW" ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleIniciarFlow}
                    className="w-full rounded-[6px] border border-[--color-brand] px-4 py-2 text-[13px] font-medium text-[--color-brand] transition-colors hover:bg-[--color-brand-subtle] disabled:opacity-50"
                  >
                    {loading ? "Redirigiendo…" : "Pagar con Flow"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleMarcarPagado}
                    className="w-full rounded-[6px] border border-emerald-500 px-4 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {loading ? "Guardando…" : "Marcar como pagado"}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
