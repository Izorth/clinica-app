import { requireActor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { actor, error } = await requireActor();
  if (error) return error;

  const { id } = await params;

  if (actor.rol === "MEDICO") {
    // medicoId null (Usuario MEDICO sin fila Medico) no ve ningún paciente.
    const atendido = actor.medicoId
      ? await prisma.hora.findFirst({
          where: { pacienteId: id, medicoId: actor.medicoId },
          select: { id: true },
        })
      : null;
    if (!atendido) {
      return Response.json({ error: "Paciente no encontrado" }, { status: 404 });
    }
  }

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      // NOTA (deuda, no arreglar acá): Ficha no tiene autor (sin medicoId ni
      // usuarioId en el schema), así que "solo las notas del médico tratante"
      // es inexpresable hoy — un médico tratante ve TODAS las fichas del
      // paciente, incluidas las que escribió otro médico. Es limitación de
      // schema, no de autorización; requiere migración para resolverse.
      fichas: {
        orderBy: { creadoEn: "desc" },
      },
      horas: {
        where: actor.rol === "MEDICO" ? { medicoId: actor.medicoId! } : undefined,
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
