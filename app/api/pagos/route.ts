import type { NextRequest } from "next/server";

import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { pagoInclude } from "@/lib/prisma/includes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const pacienteId = searchParams.get("pacienteId");
  const estado     = searchParams.get("estado");
  const medicoId   = searchParams.get("medicoId");

  const pagos = await prisma.pago.findMany({
    where: {
      ...(pacienteId ? { pacienteId } : {}),
      ...(estado     ? { estado: estado as "PENDIENTE" | "PAGADO" | "FALLIDO" } : {}),
      ...(medicoId   ? { hora: { medicoId } } : {}),
    },
    include: pagoInclude,
    orderBy: { creadoEn: "desc" },
  });

  return Response.json(pagos);
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(["ADMIN", "RECEPCIONISTA"]);
  if (error) return error;

  const body = await request.json();
  const { horaId, pacienteId, monto, medioPago } = body;

  if (!horaId || !pacienteId || !monto) {
    return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  try {
    const pago = await prisma.pago.create({
      data: {
        horaId,
        pacienteId,
        monto: Number(monto),
        medioPago: medioPago ?? "EFECTIVO",
        estado: "PENDIENTE",
      },
      include: pagoInclude,
    });

    return Response.json(pago, { status: 201 });
  } catch {
    return Response.json({ error: "Error al registrar el pago" }, { status: 500 });
  }
}
