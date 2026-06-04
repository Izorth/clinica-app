const TZ = "America/Santiago";

export function toSantiagoDate(iso: string | Date): Date {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, parseInt(p.value, 10)]),
  );
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second);
}

export function formatHoraSantiago(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
