import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth-helpers";
import { pagoInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";
import { emitirBoleta } from "@/lib/services/bsale";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const { id } = await params;

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: pagoInclude,
  });

  if (!pago) {
    return Response.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  if (pago.estado !== "PAGADO") {
    return Response.json({ error: "Solo se pueden emitir boletas de pagos confirmados" }, { status: 400 });
  }

  if (pago.boletoId) {
    return Response.json({ error: "Este pago ya tiene una boleta emitida" }, { status: 409 });
  }

  try {
    const boleta = await emitirBoleta({
      monto: pago.monto,
      descripcion: `Consulta médica — ${pago.hora.medico.usuario.nombre}`,
      rutCliente: pago.paciente.rut,
      nombreCliente: `${pago.paciente.nombre} ${pago.paciente.apellido}`,
      emailCliente: pago.paciente.email ?? undefined,
    });

    const updated = await prisma.pago.update({
      where: { id },
      data: {
        boletoId:     boleta.id,
        boletoNumero: boleta.number,
        boletoUrl:    boleta.urlPdf,
        boletoEstado: String(boleta.state),
      },
      include: pagoInclude,
    });

    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al emitir boleta";
    return Response.json({ error: message }, { status: 500 });
  }
}
