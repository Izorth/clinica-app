import { toSantiagoDate } from "@/lib/utils/dates";
import { HoraCard } from "./hora-card";
import type { Hora } from "./hora-card";

type VistaSemanalProps = {
  horas: Hora[];
  fechaBase: Date;
  onSlotClick: (fecha: Date) => void;
  onHoraClick: (hora: Hora) => void;
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HORA_INICIO = 8;
const HORA_FIN = 18;

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayShort(d: Date): string {
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function VistaSemanal({ horas, fechaBase, onSlotClick, onHoraClick }: VistaSemanalProps) {
  const lunes = getMonday(fechaBase);
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });

  const slots: { h: number; m: number }[] = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    slots.push({ h, m: 0 });
    slots.push({ h, m: 30 });
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
          <div className="border-b border-zinc-200 dark:border-zinc-700" />
          {days.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={i}
                className={`border-b border-l border-zinc-200 px-1 py-2 text-center text-xs font-semibold dark:border-zinc-700 ${
                  isToday
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-300"
                }`}
              >
                {DIAS[i]}
                <br />
                <span className="font-normal">{formatDayShort(d)}</span>
              </div>
            );
          })}
        </div>

        {/* Slots */}
        {slots.map(({ h, m }) => {
          const timeLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          return (
            <div
              key={timeLabel}
              className="grid"
              style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
            >
              <div className="border-b border-zinc-100 pr-2 pt-0.5 text-right text-[10px] leading-none text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                {timeLabel}
              </div>
              {days.map((day, di) => {
                const horasSlot = horas.filter((hora) => {
                  const fd = toSantiagoDate(hora.fecha);
                  return isSameDay(fd, day) && fd.getHours() === h && fd.getMinutes() === m;
                });

                const slotDate = new Date(day);
                slotDate.setHours(h, m, 0, 0);

                return (
                  <div
                    key={di}
                    className="relative min-h-[38px] border-b border-l border-zinc-100 dark:border-zinc-800"
                  >
                    <button
                      onClick={() => onSlotClick(slotDate)}
                      className="absolute inset-0 w-full hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40"
                      aria-label={`Nueva hora el ${formatDayShort(day)} a las ${timeLabel}`}
                    />
                    {horasSlot.length > 0 && (
                      <div className="relative z-10 flex flex-col gap-0.5 p-0.5">
                        {horasSlot.map((hora) => (
                          <HoraCard
                            key={hora.id}
                            hora={hora}
                            onClick={() => onHoraClick(hora)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
