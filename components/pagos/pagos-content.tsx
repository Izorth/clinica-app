"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Plus, Receipt } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { usePagos, type Pago } from "@/lib/hooks/usePagos";
import { formatHoraSantiago } from "@/lib/utils/dates";
import {
  ESTADO_PAGO_LABELS,
  MEDIO_PAGO_LABELS,
  estadoPagoBadgeClass,
  estadoPagoDotClass,
  type EstadoPago,
} from "@/lib/utils/estados";
import { PagoModal } from "./pago-modal";

function formatMonto(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}

function FlashBanner({ msg, type }: { msg: string; type: "ok" | "error" }) {
  return (
    <div
      className={[
        "rounded-[8px] px-4 py-3 text-[13px] font-medium",
        type === "ok"
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
      ].join(" ")}
    >
      {type === "ok" ? "✓ Pago procesado exitosamente por Flow." : "✗ El pago Flow no pudo completarse."}
    </div>
  );
}

type FilterEstado = EstadoPago | "TODOS";

export function PagosContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const flowResult   = searchParams.get("flow") as "ok" | "error" | null;

  const [filterEstado, setFilterEstado] = useState<FilterEstado>("TODOS");
  const [showModal, setShowModal]       = useState(false);
  const [editPago, setEditPago]         = useState<Pago | null>(null);
  const [generatingBoleta, setGeneratingBoleta] = useState<string | null>(null);
  const [boletaError, setBoletaError]   = useState<string | null>(null);

  const { data: pagos = [], isLoading } = usePagos(
    filterEstado !== "TODOS" ? { estado: filterEstado } : {}
  );

  // Totals
  const totalPendiente = pagos.filter((p) => p.estado === "PENDIENTE").reduce((s, p) => s + p.monto, 0);
  const totalPagado    = pagos.filter((p) => p.estado === "PAGADO").reduce((s, p) => s + p.monto, 0);

  useEffect(() => {
    if (flowResult) {
      void queryClient.invalidateQueries({ queryKey: ["pagos"] });
    }
  }, [flowResult, queryClient]);

  async function emitirBoleta(pago: Pago) {
    setBoletaError(null);
    setGeneratingBoleta(pago.id);
    try {
      const res = await fetch(`/api/pagos/${pago.id}/boleta`, { method: "POST" });
      const data = await res.json() as { error?: string; boletoUrl?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al emitir boleta");
      await queryClient.invalidateQueries({ queryKey: ["pagos"] });
      if (data.boletoUrl) window.open(data.boletoUrl, "_blank");
    } catch (err) {
      setBoletaError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGeneratingBoleta(null);
    }
  }

  const FILTROS: { label: string; value: FilterEstado }[] = [
    { label: "Todos", value: "TODOS" },
    { label: "Pendientes", value: "PENDIENTE" },
    { label: "Pagados", value: "PAGADO" },
    { label: "Fallidos", value: "FALLIDO" },
  ];

  return (
    <motion.main
      className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Flash from Flow return */}
      {flowResult && <FlashBanner msg="" type={flowResult} />}

      {boletaError && (
        <div className="rounded-[8px] bg-red-50 px-4 py-3 text-[13px] text-red-800 dark:bg-red-950/30 dark:text-red-300">
          {boletaError}
        </div>
      )}

      {/* Header + stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[--color-text]">Pagos</h1>
          <p className="mt-0.5 text-[13px] text-[--color-text-muted]">
            Gestión de cobros y boletas electrónicas (SII)
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditPago(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 rounded-[6px] bg-[--color-brand] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar pago
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[--color-border-stone] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-[12px] font-medium uppercase tracking-wide text-[--color-text-muted]">
            Por cobrar
          </p>
          <p className="mt-2 font-mono text-[24px] font-semibold text-amber-600">
            {formatMonto(totalPendiente)}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border-stone] bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-[12px] font-medium uppercase tracking-wide text-[--color-text-muted]">
            Recaudado
          </p>
          <p className="mt-2 font-mono text-[24px] font-semibold text-emerald-600">
            {formatMonto(totalPagado)}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-[8px] border border-[--color-border-stone] bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-800/50 w-fit">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilterEstado(f.value)}
            className={[
              "rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors",
              filterEstado === f.value
                ? "bg-white text-[--color-text] shadow-sm dark:bg-stone-700 dark:text-stone-100"
                : "text-[--color-text-muted] hover:text-[--color-text]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[--color-border-stone] bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-[6px] bg-stone-100 dark:bg-stone-800" />
            ))}
          </div>
        ) : pagos.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-[--color-text-muted]">
            No hay pagos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[--color-border-stone] bg-stone-50/80 dark:border-stone-700 dark:bg-stone-800/50">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Fecha</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Paciente</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Médico</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Monto</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Medio</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[--color-text-muted]">Boleta</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border-stone] dark:divide-stone-700">
                {pagos.map((pago) => (
                  <tr
                    key={pago.id}
                    className="transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[--color-text-muted]">
                      {formatHoraSantiago(pago.hora.fecha)}
                    </td>
                    <td className="px-4 py-3 text-[--color-text]">
                      <p>{pago.paciente.nombre} {pago.paciente.apellido}</p>
                      <p className="font-mono text-[11px] text-[--color-text-muted]">{pago.paciente.rut}</p>
                    </td>
                    <td className="px-4 py-3 text-[--color-text-muted]">
                      {pago.hora.medico.usuario.nombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-[--color-text]">
                      {formatMonto(pago.monto)}
                    </td>
                    <td className="px-4 py-3 text-[--color-text-muted]">
                      {MEDIO_PAGO_LABELS[pago.medioPago]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={estadoPagoBadgeClass(pago.estado)}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${estadoPagoDotClass(pago.estado)}`} />
                        {ESTADO_PAGO_LABELS[pago.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pago.boletoNumero ? (
                        <a
                          href={pago.boletoUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[--color-brand] hover:underline"
                        >
                          <Receipt className="h-3 w-3" />
                          N° {pago.boletoNumero}
                        </a>
                      ) : pago.estado === "PAGADO" ? (
                        <button
                          type="button"
                          onClick={() => void emitirBoleta(pago)}
                          disabled={generatingBoleta === pago.id}
                          className="inline-flex items-center gap-1 text-[12px] text-[--color-text-muted] hover:text-[--color-brand] disabled:opacity-50"
                        >
                          <FileText className="h-3 w-3" />
                          {generatingBoleta === pago.id ? "Emitiendo…" : "Emitir"}
                        </button>
                      ) : (
                        <span className="text-[12px] text-[--color-text-muted]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setEditPago(pago); setShowModal(true); }}
                        className="rounded-[4px] px-2.5 py-1 text-[12px] text-[--color-text-muted] hover:bg-stone-100 hover:text-[--color-text] dark:hover:bg-stone-700"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <PagoModal
          onClose={() => { setShowModal(false); setEditPago(null); }}
          pago={editPago ?? undefined}
          onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["pagos"] })}
        />
      )}
    </motion.main>
  );
}
