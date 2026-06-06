import type { NextRequest } from "next/server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { pagoInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const pago = await prisma.pago.findUnique({ where: { id }, include: pagoInclude });

  if (!pago) {
    return Response.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  return Response.json(pago);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { estado, monto, medioPago } = body;

  try {
    const pago = await prisma.pago.update({
      where: { id },
      data: {
        ...(estado    !== undefined ? { estado }              : {}),
        ...(monto     !== undefined ? { monto: Number(monto) } : {}),
        ...(medioPago !== undefined ? { medioPago }           : {}),
      },
      include: pagoInclude,
    });

    // When marking as PAGADO, update the linked Hora to COMPLETADA if not already
    if (estado === "PAGADO") {
      await prisma.hora.update({
        where: { id: pago.horaId },
        data: { estado: "COMPLETADA" },
      });
    }

    return Response.json(pago);
  } catch {
    return Response.json({ error: "Error al actualizar el pago" }, { status: 500 });
  }
}
