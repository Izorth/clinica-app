import { HoraCard } from "./hora-card";
import type { Hora } from "./hora-card";

type VistaMensualProps = {
  horas: Hora[];
  fechaBase: Date;
  onSlotClick: (fecha: Date) => void;
  onHoraClick: (hora: Hora) => void;
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

export function VistaMensual({ horas, fechaBase, onSlotClick, onHoraClick }: VistaMensualProps) {
  const year = fechaBase.getFullYear();
  const month = fechaBase.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = getMonday(firstDay);

  const lastDayOfWeek = lastDay.getDay();
  const endDate = new Date(lastDay);
  if (lastDayOfWeek !== 0) {
    endDate.setDate(endDate.getDate() + (7 - lastDayOfWeek));
  }

  const days: Date[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700">
        {DIAS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const dayHoras = horas.filter((h) =>
            isSameDay(
              new Date(new Date(h.fecha).toLocaleString("en-US", { timeZone: "America/Santiago" })),
              day
            )
          );

          const slotDate = new Date(day);
          slotDate.setHours(9, 0, 0, 0);

          return (
            <div
              key={i}
              className={`relative min-h-[96px] border-b border-l border-zinc-200 p-1 dark:border-zinc-700 ${
                !isCurrentMonth ? "bg-zinc-50/70 dark:bg-zinc-900/20" : ""
              } ${i % 7 === 6 ? "border-r" : ""}`}
            >
              {/* Background clickable */}
              <button
                onClick={() => onSlotClick(slotDate)}
                className="absolute inset-0 w-full hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30"
                aria-label={`Nueva hora el ${day.toLocaleDateString("es-CL")}`}
              />

              {/* Day number */}
              <div className="relative z-10 mb-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : isCurrentMonth
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Horas */}
              <div className="relative z-10 space-y-0.5">
                {dayHoras.slice(0, 3).map((hora) => (
                  <HoraCard key={hora.id} hora={hora} onClick={() => onHoraClick(hora)} />
                ))}
                {dayHoras.length > 3 && (
                  <p className="pl-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    +{dayHoras.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
