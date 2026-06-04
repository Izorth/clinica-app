export type Rol = "ADMIN" | "MEDICO" | "RECEPCIONISTA";

export const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MEDICO: "Médico",
  RECEPCIONISTA: "Recepcionista",
};

export function rolLabel(rol: string): string {
  return ROL_LABELS[rol] ?? rol;
}
