export type PartidoFecha = { jornada: number; fechaHora: string };

/** Una jornada se cierra al kickoff del primer (más temprano) partido de esa jornada. */
export function jornadaCerrada(
  jornada: number,
  partidos: PartidoFecha[],
  ahora: Date = new Date()
): boolean {
  const fechas = partidos
    .filter((p) => p.jornada === jornada)
    .map((p) => new Date(p.fechaHora).getTime());
  if (fechas.length === 0) return false;
  const primerKickoff = Math.min(...fechas);
  return ahora.getTime() >= primerKickoff;
}
