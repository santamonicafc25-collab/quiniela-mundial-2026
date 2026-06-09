export type Marcador = { local: number; visitante: number };

function signo(m: Marcador): -1 | 0 | 1 {
  if (m.local > m.visitante) return 1;
  if (m.local < m.visitante) return -1;
  return 0;
}

/** 2 = marcador exacto, 1 = resultado (1X2) acertado, 0 = fallo. */
export function puntosPronostico(pred: Marcador, real: Marcador): 0 | 1 | 2 {
  if (pred.local === real.local && pred.visitante === real.visitante) return 2;
  if (signo(pred) === signo(real)) return 1;
  return 0;
}
