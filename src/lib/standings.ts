export type PartidoResultado = {
  grupo: string;
  local: string;
  visitante: string;
  gl: number;
  gv: number;
};

export type FilaTabla = {
  grupo: string;
  equipo: string;
  pj: number; g: number; e: number; p: number;
  gf: number; gc: number; dg: number; pts: number;
};

function vacia(grupo: string, equipo: string): FilaTabla {
  return { grupo, equipo, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

function acumular(t: Map<string, FilaTabla>, grupo: string, equipo: string, gf: number, gc: number) {
  const f = t.get(equipo) ?? vacia(grupo, equipo);
  f.pj += 1; f.gf += gf; f.gc += gc; f.dg = f.gf - f.gc;
  if (gf > gc) { f.g += 1; f.pts += 3; }
  else if (gf === gc) { f.e += 1; f.pts += 1; }
  else { f.p += 1; }
  t.set(equipo, f);
}

const ordenar = (a: FilaTabla, b: FilaTabla) =>
  b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo);

export function tablaGrupo(grupo: string, partidos: PartidoResultado[]): FilaTabla[] {
  const t = new Map<string, FilaTabla>();
  for (const p of partidos.filter((x) => x.grupo === grupo)) {
    acumular(t, grupo, p.local, p.gl, p.gv);
    acumular(t, grupo, p.visitante, p.gv, p.gl);
  }
  return [...t.values()].sort(ordenar);
}

/** Tercer clasificado de cada grupo, ordenados entre sí por pts→dg→gf. */
export function rankingTerceros(grupos: string[], partidos: PartidoResultado[]): FilaTabla[] {
  const terceros: FilaTabla[] = [];
  for (const grupo of grupos) {
    const tabla = tablaGrupo(grupo, partidos);
    if (tabla.length >= 3) terceros.push(tabla[2]);
  }
  return terceros.sort(ordenar);
}
