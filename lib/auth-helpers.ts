import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/lib/utils/roles";

export type Actor = { userId: string; rol: Rol; medicoId: string | null };

type ActorOk = { actor: Actor; error: null };
type ActorErr = { actor: null; error: Response };

/**
 * Resuelve quién hace la request. Si el rol es MEDICO, busca su Medico
 * asociado para scoping por dueño en cada ruta.
 *
 * Un MEDICO sin fila Medico (usuario mal provisionado) obtiene medicoId: null.
 * Cada ruta que use esto DEBE tratar medicoId null como "no ve nada" — nunca
 * como "sin filtro, ve todo" (ese es el bug que esto reemplaza).
 */
export async function requireActor(roles?: Rol[]): Promise<ActorOk | ActorErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { actor: null, error: Response.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const rol = session.user.rol as Rol;
  if (roles && !roles.includes(rol)) {
    return { actor: null, error: Response.json({ error: "Acceso denegado" }, { status: 403 }) };
  }

  let medicoId: string | null = null;
  if (rol === "MEDICO") {
    const medico = await prisma.medico.findUnique({
      where: { usuarioId: session.user.id },
      select: { id: true },
    });
    medicoId = medico?.id ?? null;
  }

  return { actor: { userId: session.user.id, rol, medicoId }, error: null };
}

type AuthResult = { error: null } | { error: Response };

export async function requireAuth(): Promise<AuthResult> {
  const { error } = await requireActor();
  return { error };
}

export async function requireRole(roles: Rol[]): Promise<AuthResult> {
  const { error } = await requireActor(roles);
  return { error };
}
