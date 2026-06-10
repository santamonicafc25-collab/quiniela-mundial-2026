import { describe, it, expect } from "vitest";
import { DIECISEISAVOS, RONDAS_SIGUIENTES, asignarTerceros } from "./bracket";

describe("estructura del bracket", () => {
  it("tiene 16 partidos de dieciseisavos con códigos 73-88", () => {
    expect(DIECISEISAVOS).toHaveLength(16);
    expect(DIECISEISAVOS[0].codigo).toBe(73);
    expect(DIECISEISAVOS[0].local).toBe("2A");
    expect(DIECISEISAVOS[0].visitante).toBe("2B");
    expect(DIECISEISAVOS[6].local).toBe("1A");
    expect(DIECISEISAVOS[6].visitante).toBe("3CEFHI");
  });
  it("octavos referencian ganadores correctos", () => {
    const oct = RONDAS_SIGUIENTES.filter((r) => r.fase === "octavos");
    expect(oct).toHaveLength(8);
    expect(oct[0]).toMatchObject({ codigo: 89, local: "W73", visitante: "W75" });
  });
});

describe("asignarTerceros", () => {
  it("asigna cada ranura de tercero a un grupo del conjunto clasificado", () => {
    const grupos = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const asign = asignarTerceros(grupos);
    expect(Object.keys(asign)).toHaveLength(8);
    expect(new Set(Object.values(asign)).size).toBe(8);
    grupos.forEach((g) => expect(Object.values(asign)).toContain(g));
  });
});
