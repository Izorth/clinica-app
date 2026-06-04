import { formatHoraSantiago } from "@/lib/utils/dates";
import { type EstadoHora, estadoCardClases, estadoDotClass } from "@/lib/utils/estados";

export type { EstadoHora } from "@/lib/utils/estados";

export type Hora = {
  id: string;
  fecha: string;
  estado: EstadoHora;
  medicoId: string;
  medico: { id: string; especialidad: string; usuario: { nombre: string } };
  pacienteId: string;
  paciente: { id: string; nombre: string; apellido: string; rut: string };
};

type HoraCardProps = {
  hora: Hora;
  onClick: () => void;
};

export function HoraCard({ hora, onClick }: HoraCardProps) {
  const tiempo = formatHoraSantiago(hora.fecha);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-1.5 py-1 text-left text-xs leading-tight transition-opacity hover:opacity-75 ${estadoCardClases[hora.estado]}`}
    >
      <p className="flex items-center gap-1 font-semibold">
        <span className={`h-1.5 w-1.5 rounded-full ${estadoDotClass(hora.estado)}`} />
        {tiempo}
      </p>
      <p className="truncate">
        {hora.paciente.nombre} {hora.paciente.apellido}
      </p>
      <p className="truncate opacity-75">Dr. {hora.medico.usuario.nombre}</p>
    </button>
  );
}
