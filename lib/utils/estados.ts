export type EstadoHora = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";

export const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  COMPLETADA: "Completada",
};

// Compact card — used in HoraCard (calendar cells)
export const estadoCardClases: Record<EstadoHora, string> = {
  PENDIENTE:  "bg-amber-50  border-l-2 border-amber-400   text-amber-800  dark:bg-amber-950/30  dark:text-amber-300",
  CONFIRMADA: "bg-emerald-50 border-l-2 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELADA:  "bg-red-50    border-l-2 border-red-500     text-red-800    dark:bg-red-950/30    dark:text-red-300",
  COMPLETADA: "bg-stone-50  border-l-2 border-stone-400   text-stone-600  dark:bg-stone-800     dark:text-stone-400",
};

// Badge pill — pill con borde izquierdo + fondo sutil (DESIGN.md §Componentes)
export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case "CONFIRMADA":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-emerald-500 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "PENDIENTE":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-amber-400 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
    case "CANCELADA":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-red-500 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-red-800 dark:bg-red-950/30 dark:text-red-300";
    default:
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-stone-400 bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-400";
  }
}

// Dot indicator — used inside badges and HoraCard
export function estadoDotClass(estado: string): string {
  switch (estado) {
    case "CONFIRMADA": return "bg-emerald-500";
    case "PENDIENTE":  return "bg-amber-400";
    case "CANCELADA":  return "bg-red-500";
    default:           return "bg-stone-400";
  }
}

// ── EstadoPago ──────────────────────────────────────────────────────────────

export type EstadoPago = "PENDIENTE" | "PAGADO" | "FALLIDO";
export type MedioPago  = "EFECTIVO" | "TRANSFERENCIA" | "FLOW" | "WEBPAY";

export const ESTADO_PAGO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PAGADO:    "Pagado",
  FALLIDO:   "Fallido",
};

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  EFECTIVO:      "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FLOW:          "Flow",
  WEBPAY:        "Webpay",
};

export function estadoPagoBadgeClass(estado: EstadoPago): string {
  switch (estado) {
    case "PAGADO":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-emerald-500 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "PENDIENTE":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-amber-400 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
    case "FALLIDO":
      return "inline-flex items-center gap-1.5 rounded-full border-l-2 border-red-500 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-red-800 dark:bg-red-950/30 dark:text-red-300";
  }
}

export function estadoPagoDotClass(estado: EstadoPago): string {
  switch (estado) {
    case "PAGADO":   return "bg-emerald-500";
    case "PENDIENTE": return "bg-amber-400";
    case "FALLIDO":  return "bg-red-500";
  }
}
