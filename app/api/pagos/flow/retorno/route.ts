import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { obtenerEstadoPago, flowStatusToEstadoPago } from "@/lib/services/flow";

export const dynamic = "force-dynamic";

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url));
}

// Flow redirects the browser here after the user completes (or cancels) payment.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return redirectTo(request, "/dashboard/pagos?flow=error");

  try {
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

    return redirectTo(request, `/dashboard/pagos?flow=${estado === "PAGADO" ? "ok" : "error"}`);
  } catch {
    return redirectTo(request, "/dashboard/pagos?flow=error");
  }
}

// Flow also calls this as POST in some configurations
export async function POST(request: NextRequest) {
  return GET(request);
}
