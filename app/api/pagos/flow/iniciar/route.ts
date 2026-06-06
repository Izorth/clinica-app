import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth-helpers";
import { pagoInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";
import { crearOrdenFlow, urlPagoFlow } from "@/lib/services/flow";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const body = await request.json();
  const { pagoId } = body;

  if (!pagoId) {
    return Response.json({ error: "Falta pagoId" }, { status: 400 });
  }

  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: pagoInclude,
  });

  if (!pago) {
    return Response.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  if (pago.estado !== "PENDIENTE") {
    return Response.json({ error: "Este pago ya fue procesado" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const result = await crearOrdenFlow({
      commerceOrder: pago.id,
      subject: `Consulta médica — ${pago.hora.medico.usuario.nombre}`,
      amount: pago.monto,
      email: pago.paciente.email ?? `${pago.paciente.rut}@noemail.cl`,
      urlReturn: `${appUrl}/api/pagos/flow/retorno`,
      urlConfirmation: `${appUrl}/api/pagos/flow/webhook`,
    });

    await prisma.pago.update({
      where: { id: pago.id },
      data: {
        flowToken:   result.token,
        flowOrderId: pago.id,
        medioPago:   "FLOW",
      },
    });

    return Response.json({ redirectUrl: urlPagoFlow(result.url, result.token) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error iniciando pago";
    return Response.json({ error: message }, { status: 500 });
  }
}
