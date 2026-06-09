export type FilaRanking = {
  nombre: string;
  puntos: number;
  exactos: number;
  registro: number; // orden de registro (menor = antes)
};

export function ordenarRanking(filas: FilaRanking[]): FilaRanking[] {
  return [...filas].sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.exactos - a.exactos ||
      a.registro - b.registro
  );
}
