import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerEstadoPago, flowStatusToEstadoPago } from "@/lib/services/flow";

export const dynamic = "force-dynamic";

// Flow server-to-server confirmation webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const token = body.get("token") as string | null;
    if (!token) return Response.json({ ok: false }, { status: 400 });

    const status = await obtenerEstadoPago(token);
    const estado = flowStatusToEstadoPago(status.status);

    const pago = await prisma.pago.findFirst({ where: { flowToken: token } });
    if (pago) {
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado,
          flowPaymentId: status.flowOrder,
        },
      });

      if (estado === "PAGADO") {
        await prisma.hora.update({
          where: { id: pago.horaId },
          data: { estado: "COMPLETADA" },
        });
      }
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
