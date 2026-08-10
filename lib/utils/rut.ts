/** Quita puntos, guiones y espacios; deja el dígito verificador en mayúscula. */
export function limpiarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

/** Dígito verificador (módulo 11) del cuerpo numérico de un RUT. */
export function calcularDv(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/**
 * Valida un RUT chileno con su dígito verificador.
 * Acepta con o sin puntos/guión: "12.345.678-5", "12345678-5", "123456785".
 * Cuerpo de 6 a 8 dígitos: incluye RUTs antiguos (< 1.000.000) y los de
 * empresas (50.000.000+), que también se atienden en una clínica.
 */
export function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (!/^\d{6,8}[\dK]$/.test(limpio)) return false;
  return calcularDv(limpio.slice(0, -1)) === limpio.slice(-1);
}

/**
 * Canoniza a "12.345.678-5". Se guarda siempre así para que el mismo RUT
 * escrito de dos formas distintas no genere dos fichas del mismo paciente
 * (la restricción unique de Prisma compara el string tal cual).
 */
export function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut);
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}
