export type PartidoFecha = { jornada: number; fechaHora: string };

/** Cierre global de la fase de grupos: 12-jun-2026 00:00 hora de España (CEST) = 11-jun 22:00 UTC. */
export const CIERRE_GRUPOS = "2026-06-11T22:00:00Z";

/** A partir del cierre global, los pronósticos de la fase de grupos quedan bloqueados. */
export function gruposBloqueados(fase: string, ahora: Date = new Date()): boolean {
  return fase === "grupos" && ahora.getTime() >= new Date(CIERRE_GRUPOS).getTime();
}

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
