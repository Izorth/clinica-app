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
  PENDIENTE: "bg-yellow-100 border-yellow-400/30 text-yellow-800",
  CONFIRMADA: "bg-green-100 border-green-400/30 text-green-800",
  CANCELADA: "bg-red-100 border-red-400/30 text-red-800",
  COMPLETADA: "bg-zinc-100 border-zinc-400/30 text-zinc-600",
};

const estadoDotClases: Record<EstadoHora, string> = {
  PENDIENTE: "bg-yellow-500",
  CONFIRMADA: "bg-green-500",
  CANCELADA: "bg-red-500",
  COMPLETADA: "bg-zinc-400",
};

type HoraCardProps = {
  hora: Hora;
  onClick: () => void;
};

export function HoraCard({ hora, onClick }: HoraCardProps) {
  const fecha = new Date(hora.fecha);
  const fdSantiago = new Date(fecha.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const hh = String(fdSantiago.getHours()).padStart(2, "0");
  const mm = String(fdSantiago.getMinutes()).padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-1.5 py-1 text-left text-xs leading-tight transition-opacity hover:opacity-75 ${estadoClases[hora.estado]}`}
    >
      <p className="flex items-center gap-1 font-semibold">
        <span className={`h-1.5 w-1.5 rounded-full ${estadoDotClases[hora.estado]}`} />
        {hh}:{mm}
      </p>
      <p className="truncate">
        {hora.paciente.nombre} {hora.paciente.apellido}
      </p>
      <p className="truncate opacity-75">Dr. {hora.medico.usuario.nombre}</p>
    </button>
  );
}
