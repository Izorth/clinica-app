export const horaInclude = {
  medico: {
    include: {
      usuario: { select: { nombre: true } },
    },
  },
  paciente: {
    select: { id: true, nombre: true, apellido: true, rut: true, telefono: true },
  },
} as const;
