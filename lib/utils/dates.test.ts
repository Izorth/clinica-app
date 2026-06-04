import { describe, it, expect } from "vitest";
import { toSantiagoDate, formatHoraSantiago } from "./dates";

describe("toSantiagoDate", () => {
  it("convierte UTC a hora Santiago (UTC-3 en verano)", () => {
    // 2025-01-15T15:00:00Z → 12:00 en Santiago (UTC-3)
    const d = toSantiagoDate("2025-01-15T15:00:00.000Z");
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(0);
  });

  it("convierte UTC a hora Santiago (UTC-4 en invierno)", () => {
    // 2025-07-10T16:00:00Z → 12:00 en Santiago (UTC-4)
    const d = toSantiagoDate("2025-07-10T16:00:00.000Z");
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(0);
  });

  it("preserva la fecha correcta", () => {
    const d = toSantiagoDate("2025-03-20T02:00:00.000Z");
    expect(d.getDate()).toBe(19); // UTC-3 → día anterior
  });

  it("acepta objeto Date", () => {
    const input = new Date("2025-06-01T20:00:00.000Z");
    const d = toSantiagoDate(input);
    expect(d.getHours()).toBe(16); // UTC-4 en invierno
  });
});

describe("formatHoraSantiago", () => {
  it("formatea hora como HH:MM", () => {
    const result = formatHoraSantiago("2025-07-10T16:30:00.000Z");
    expect(result).toBe("12:30");
  });

  it("padea con cero horas de un dígito", () => {
    const result = formatHoraSantiago("2025-07-10T13:05:00.000Z");
    expect(result).toBe("09:05");
  });
});
