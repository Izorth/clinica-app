export type EstadoHora = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";

export type Hora = {
  id: string;
  fecha: string;
  estado: EstadoHora;
  medicoId: string;
  medico: { id: string; especialidad: string; usuario: { nombre: string } };
  pacienteId: string;
  paciente: { id: string; nombre: string; apellido: string; rut: string };
};

const estadoClases: Record<EstadoHora, string> = {
  PENDIENTE: "bg-yellow-100 border-yellow-400 text-yellow-800",
  CONFIRMADA: "bg-green-100 border-green-400 text-green-800",
  CANCELADA: "bg-red-100 border-red-400 text-red-800",
  COMPLETADA: "bg-zinc-100 border-zinc-400 text-zinc-600",
};

type HoraCardProps = {
  hora: Hora;
  onClick: () => void;
};

export function HoraCard({ hora, onClick }: HoraCardProps) {
  const fecha = new Date(hora.fecha);
  const offsetMs = 4 * 60 * 60 * 1000;
  const fechaChile = new Date(fecha.getTime() - offsetMs);
  const hh = String(fechaChile.getHours()).padStart(2, "0");
  const mm = String(fechaChile.getMinutes()).padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-1.5 py-1 text-left text-xs leading-tight transition-opacity hover:opacity-75 ${estadoClases[hora.estado]}`}
    >
      <p className="font-semibold">
        {hh}:{mm}
      </p>
      <p className="truncate">
        {hora.paciente.nombre} {hora.paciente.apellido}
      </p>
      <p className="truncate opacity-75">Dr. {hora.medico.usuario.nombre}</p>
    </button>
  );
}
