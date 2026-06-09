import { describe, it, expect } from "vitest";
import { jornadaCerrada } from "./locking";

const partidos = [
  { jornada: 1, fechaHora: "2026-06-11T16:00:00Z" },
  { jornada: 1, fechaHora: "2026-06-11T19:00:00Z" },
  { jornada: 2, fechaHora: "2026-06-15T16:00:00Z" },
];

describe("jornadaCerrada", () => {
  it("está abierta antes del kickoff del primer partido de la jornada", () => {
    const ahora = new Date("2026-06-11T15:59:00Z");
    expect(jornadaCerrada(1, partidos, ahora)).toBe(false);
  });
  it("está cerrada en el kickoff del primer partido de la jornada", () => {
    const ahora = new Date("2026-06-11T16:00:00Z");
    expect(jornadaCerrada(1, partidos, ahora)).toBe(true);
  });
  it("la jornada 2 sigue abierta aunque la 1 esté cerrada", () => {
    const ahora = new Date("2026-06-11T16:00:00Z");
    expect(jornadaCerrada(2, partidos, ahora)).toBe(false);
  });
});
