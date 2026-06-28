export type FaseElim = "dieciseisavos" | "octavos" | "cuartos" | "semis" | "tercer_puesto" | "final";

export type LlaveBase = {
  codigo: number;
  fase: FaseElim;
  local: string;
  visitante: string;
  fechaHora: string;
  sede: string;
};

export const DIECISEISAVOS: LlaveBase[] = [
  { codigo: 73, fase: "dieciseisavos", local: "2A", visitante: "2B", fechaHora: "2026-06-28T19:00:00Z", sede: "Los Ángeles" },
  { codigo: 74, fase: "dieciseisavos", local: "1C", visitante: "2F", fechaHora: "2026-06-29T17:00:00Z", sede: "Houston" },
  { codigo: 75, fase: "dieciseisavos", local: "1E", visitante: "3ABCDF", fechaHora: "2026-06-29T20:30:00Z", sede: "Boston" },
  { codigo: 76, fase: "dieciseisavos", local: "1F", visitante: "2C", fechaHora: "2026-06-30T01:00:00Z", sede: "Monterrey" },
  { codigo: 77, fase: "dieciseisavos", local: "2E", visitante: "2I", fechaHora: "2026-06-30T17:00:00Z", sede: "Dallas" },
  { codigo: 78, fase: "dieciseisavos", local: "1I", visitante: "3CDFGH", fechaHora: "2026-06-30T21:00:00Z", sede: "Nueva York/Nueva Jersey" },
  { codigo: 79, fase: "dieciseisavos", local: "1A", visitante: "3CEFHI", fechaHora: "2026-07-01T01:00:00Z", sede: "Ciudad de México" },
  { codigo: 80, fase: "dieciseisavos", local: "1L", visitante: "3EHIJK", fechaHora: "2026-07-01T16:00:00Z", sede: "Atlanta" },
  { codigo: 81, fase: "dieciseisavos", local: "1G", visitante: "3AEHIJ", fechaHora: "2026-07-01T20:00:00Z", sede: "Seattle" },
  { codigo: 82, fase: "dieciseisavos", local: "1D", visitante: "3BEFIJ", fechaHora: "2026-07-02T00:00:00Z", sede: "Área de la Bahía de San Francisco" },
  { codigo: 83, fase: "dieciseisavos", local: "1H", visitante: "2J", fechaHora: "2026-07-02T19:00:00Z", sede: "Los Ángeles" },
  { codigo: 84, fase: "dieciseisavos", local: "2K", visitante: "2L", fechaHora: "2026-07-02T23:00:00Z", sede: "Toronto" },
  { codigo: 85, fase: "dieciseisavos", local: "1B", visitante: "3EFGIJ", fechaHora: "2026-07-03T03:00:00Z", sede: "Vancouver" },
  { codigo: 86, fase: "dieciseisavos", local: "2D", visitante: "2G", fechaHora: "2026-07-03T18:00:00Z", sede: "Dallas" },
  { codigo: 87, fase: "dieciseisavos", local: "1J", visitante: "2H", fechaHora: "2026-07-03T22:00:00Z", sede: "Miami" },
  { codigo: 88, fase: "dieciseisavos", local: "1K", visitante: "3DEIJL", fechaHora: "2026-07-04T01:30:00Z", sede: "Kansas City" },
];

export const RONDAS_SIGUIENTES: LlaveBase[] = [
  { codigo: 89, fase: "octavos", local: "W73", visitante: "W75", fechaHora: "2026-07-04T17:00:00Z", sede: "Houston" },
  { codigo: 90, fase: "octavos", local: "W74", visitante: "W77", fechaHora: "2026-07-04T21:00:00Z", sede: "Filadelfia" },
  { codigo: 91, fase: "octavos", local: "W76", visitante: "W78", fechaHora: "2026-07-05T20:00:00Z", sede: "Nueva York/Nueva Jersey" },
  { codigo: 92, fase: "octavos", local: "W79", visitante: "W80", fechaHora: "2026-07-06T00:00:00Z", sede: "Ciudad de México" },
  { codigo: 93, fase: "octavos", local: "W83", visitante: "W84", fechaHora: "2026-07-06T19:00:00Z", sede: "Dallas" },
  { codigo: 94, fase: "octavos", local: "W81", visitante: "W82", fechaHora: "2026-07-07T00:00:00Z", sede: "Seattle" },
  { codigo: 95, fase: "octavos", local: "W86", visitante: "W88", fechaHora: "2026-07-07T16:00:00Z", sede: "Atlanta" },
  { codigo: 96, fase: "octavos", local: "W85", visitante: "W87", fechaHora: "2026-07-07T20:00:00Z", sede: "Vancouver" },
  { codigo: 97, fase: "cuartos", local: "W89", visitante: "W90", fechaHora: "2026-07-09T20:00:00Z", sede: "Boston" },
  { codigo: 98, fase: "cuartos", local: "W93", visitante: "W94", fechaHora: "2026-07-10T19:00:00Z", sede: "Los Ángeles" },
  { codigo: 99, fase: "cuartos", local: "W91", visitante: "W92", fechaHora: "2026-07-11T21:00:00Z", sede: "Miami" },
  { codigo: 100, fase: "cuartos", local: "W95", visitante: "W96", fechaHora: "2026-07-12T01:00:00Z", sede: "Kansas City" },
  { codigo: 101, fase: "semis", local: "W97", visitante: "W98", fechaHora: "2026-07-14T19:00:00Z", sede: "Dallas" },
  { codigo: 102, fase: "semis", local: "W99", visitante: "W100", fechaHora: "2026-07-15T19:00:00Z", sede: "Atlanta" },
  { codigo: 103, fase: "tercer_puesto", local: "RU101", visitante: "RU102", fechaHora: "2026-07-18T21:00:00Z", sede: "Miami" },
  { codigo: 104, fase: "final", local: "W101", visitante: "W102", fechaHora: "2026-07-19T19:00:00Z", sede: "Nueva York/Nueva Jersey" },
];

const RANURAS_TERCEROS: { ranura: string; elegibles: string[] }[] = [
  { ranura: "3ABCDF", elegibles: ["A", "B", "C", "D", "F"] },
  { ranura: "3CDFGH", elegibles: ["C", "D", "F", "G", "H"] },
  { ranura: "3CEFHI", elegibles: ["C", "E", "F", "H", "I"] },
  { ranura: "3EHIJK", elegibles: ["E", "H", "I", "J", "K"] },
  { ranura: "3AEHIJ", elegibles: ["A", "E", "H", "I", "J"] },
  { ranura: "3BEFIJ", elegibles: ["B", "E", "F", "I", "J"] },
  { ranura: "3EFGIJ", elegibles: ["E", "F", "G", "I", "J"] },
  { ranura: "3DEIJL", elegibles: ["D", "E", "I", "J", "L"] },
];

/**
 * Asigna los 8 grupos cuyos terceros clasificaron a las 8 ranuras de tercero.
 * Heurística determinista (backtracking por elegibilidad). El admin confirma/ajusta
 * antes de publicar. Devuelve { ranura: grupo }.
 */
export function asignarTerceros(gruposClasificados: string[]): Record<string, string> {
  const grupos = [...gruposClasificados];
  const ranuras = [...RANURAS_TERCEROS].sort((a, b) => a.elegibles.length - b.elegibles.length);
  const usado = new Set<string>();
  const res: Record<string, string> = {};
  const asignar = (i: number): boolean => {
    if (i === ranuras.length) return true;
    for (const g of grupos) {
      if (!usado.has(g) && ranuras[i].elegibles.includes(g)) {
        usado.add(g); res[ranuras[i].ranura] = g;
        if (asignar(i + 1)) return true;
        usado.delete(g); delete res[ranuras[i].ranura];
      }
    }
    return false;
  };
  asignar(0);
  return res;
}
