import { describe, it, expect } from "vitest";
import { ordenarRanking } from "./ranking";

describe("ordenarRanking", () => {
  it("ordena por puntos descendente", () => {
    const r = ordenarRanking([
      { nombre: "Ana", puntos: 5, exactos: 1, registro: 1 },
      { nombre: "Beto", puntos: 8, exactos: 2, registro: 2 },
    ]);
    expect(r.map((x) => x.nombre)).toEqual(["Beto", "Ana"]);
  });
  it("desempata por número de aciertos exactos", () => {
    const r = ordenarRanking([
      { nombre: "Ana", puntos: 8, exactos: 1, registro: 1 },
      { nombre: "Beto", puntos: 8, exactos: 3, registro: 2 },
    ]);
    expect(r.map((x) => x.nombre)).toEqual(["Beto", "Ana"]);
  });
  it("segundo desempate por orden de registro", () => {
    const r = ordenarRanking([
      { nombre: "Beto", puntos: 8, exactos: 2, registro: 2 },
      { nombre: "Ana", puntos: 8, exactos: 2, registro: 1 },
    ]);
    expect(r.map((x) => x.nombre)).toEqual(["Ana", "Beto"]);
  });
});
