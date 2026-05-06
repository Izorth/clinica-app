import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      fichas: {
        orderBy: { creadoEn: "desc" },
      },
      horas: {
        include: {
          medico: {
            include: {
              usuario: {
                select: { nombre: true },
              },
            },
          },
        },
        orderBy: { fecha: "asc" },
      },
    },
  });

  if (!paciente) {
    return Response.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  return Response.json(paciente);
}
