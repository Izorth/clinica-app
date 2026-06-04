import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import type { Rol } from "@/lib/utils/roles";

type AuthOk = { session: Session; error: null };
type AuthErr = { session: null; error: Response };

export async function requireAuth(): Promise<AuthOk | AuthErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: Response.json({ error: "No autorizado" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireRole(roles: Rol[]): Promise<AuthOk | AuthErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: Response.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!roles.includes(session.user.rol as Rol)) {
    return { session: null, error: Response.json({ error: "Acceso denegado" }, { status: 403 }) };
  }
  return { session, error: null };
}
