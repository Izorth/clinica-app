"use client";

import { useQuery } from "@tanstack/react-query";

import type { EstadoPago, MedioPago } from "@/lib/utils/estados";

export type Pago = {
  id: string;
  monto: number;
  estado: EstadoPago;
  medioPago: MedioPago;
  flowToken:     string | null;
  flowOrderId:   string | null;
  flowPaymentId: number | null;
  boletoId:      number | null;
  boletoNumero:  number | null;
  boletoUrl:     string | null;
  boletoEstado:  string | null;
  creadoEn: string;
  paciente: { id: string; nombre: string; apellido: string; rut: string; email: string | null };
  hora: {
    id: string;
    fecha: string;
    medico: { usuario: { nombre: string } };
  };
};

type Params = {
  pacienteId?: string;
  estado?: EstadoPago;
  medicoId?: string;
};

export function usePagos(params: Params = {}) {
  return useQuery({
    queryKey: ["pagos", params],
    queryFn: async () => {
      const url = new URL("/api/pagos", window.location.origin);
      if (params.pacienteId) url.searchParams.set("pacienteId", params.pacienteId);
      if (params.estado)     url.searchParams.set("estado", params.estado);
      if (params.medicoId)   url.searchParams.set("medicoId", params.medicoId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error cargando pagos");
      return res.json() as Promise<Pago[]>;
    },
  });
}
