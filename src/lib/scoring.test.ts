import { describe, it, expect } from "vitest";
import { puntosPronostico } from "./scoring";

describe("puntosPronostico", () => {
  it("da 2 puntos si acierta marcador exacto", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 2, visitante: 1 })).toBe(2);
  });
  it("da 1 punto si acierta el resultado (victoria local) pero no el marcador", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 3, visitante: 0 })).toBe(1);
  });
  it("da 1 punto si acierta empate pero no el marcador", () => {
    expect(puntosPronostico({ local: 1, visitante: 1 }, { local: 0, visitante: 0 })).toBe(1);
  });
  it("da 2 puntos en empate con marcador exacto", () => {
    expect(puntosPronostico({ local: 0, visitante: 0 }, { local: 0, visitante: 0 })).toBe(2);
  });
  it("da 0 puntos si falla el resultado", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 0, visitante: 2 })).toBe(0);
  });
});
