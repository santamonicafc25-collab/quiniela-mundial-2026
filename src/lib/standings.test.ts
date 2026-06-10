import { describe, it, expect } from "vitest";
import { tablaGrupo, rankingTerceros, PartidoResultado } from "./standings";

const g: PartidoResultado[] = [
  { grupo: "A", local: "México", visitante: "Sudáfrica", gl: 2, gv: 0 },
  { grupo: "A", local: "Corea del Sur", visitante: "Chequia", gl: 1, gv: 1 },
  { grupo: "A", local: "México", visitante: "Corea del Sur", gl: 1, gv: 0 },
  { grupo: "A", local: "Chequia", visitante: "Sudáfrica", gl: 0, gv: 0 },
  { grupo: "A", local: "Chequia", visitante: "México", gl: 0, gv: 3 },
  { grupo: "A", local: "Sudáfrica", visitante: "Corea del Sur", gl: 2, gv: 1 },
];

describe("tablaGrupo", () => {
  it("ordena por puntos, dif. de gol y goles a favor", () => {
    const t = tablaGrupo("A", g);
    expect(t[0].equipo).toBe("México");
    expect(t[0].pts).toBe(9);
    expect(t[0].pj).toBe(3);
    expect(t[0].dg).toBe(6);
    expect(t.map((x) => x.equipo)).toEqual(["México", "Sudáfrica", "Chequia", "Corea del Sur"]);
  });
});

describe("rankingTerceros", () => {
  it("ordena los terceros de cada grupo por pts→dg→gf", () => {
    const partidos: PartidoResultado[] = [
      ...g,
      { grupo: "B", local: "Canadá", visitante: "Catar", gl: 5, gv: 0 },
      { grupo: "B", local: "Suiza", visitante: "Bosnia y Herzegovina", gl: 1, gv: 0 },
      { grupo: "B", local: "Canadá", visitante: "Suiza", gl: 0, gv: 0 },
      { grupo: "B", local: "Bosnia y Herzegovina", visitante: "Catar", gl: 1, gv: 1 },
      { grupo: "B", local: "Bosnia y Herzegovina", visitante: "Canadá", gl: 0, gv: 2 },
      { grupo: "B", local: "Catar", visitante: "Suiza", gl: 0, gv: 3 },
    ];
    const terceros = rankingTerceros(["A", "B"], partidos);
    expect(terceros[0].equipo).toBe("Chequia");
    expect(terceros[0].grupo).toBe("A");
    expect(terceros[1].grupo).toBe("B");
  });
});
