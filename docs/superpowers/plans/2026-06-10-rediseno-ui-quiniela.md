# Rediseño UI Quiniela Mundial 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Frontend tasks should ALSO use the `frontend-design` skill for visual quality.

**Goal:** Rediseñar la UI (jugador y admin) de la quiniela con estética "Vistosa Mundial" (banderas, fechas/horas, tablas de posiciones por grupo, ranking con podio) y añadir generación automática de eliminatorias con confirmación del admin, desplegando a producción.

**Architecture:** Mantener la lógica de negocio existente (scoring 2/1/0, cierre por partido vía `jornada` única, acceso nombre+PIN). Añadir funciones puras testeadas (`standings`, `bracket`) + datos de equipos/calendario, nuevos endpoints, y reescribir las 3 páginas con componentes reutilizables. Migración de BD aditiva (no destructiva).

**Tech Stack:** Next.js 15 (App Router, TS), Tailwind v4, Supabase (Postgres), Vitest. Banderas vía flagcdn.com.

---

## File Structure

**Lógica/datos (puros, testeados):**
- `src/lib/equipos.ts` — mapa equipo→{ iso, nombre } (48 equipos) + helper `flagUrl`.
- `src/lib/standings.ts` — cálculo de tablas por grupo + ranking de terceros (TDD).
- `src/lib/bracket.ts` — estructura del cuadro (R32 feeders, rondas siguientes), calendario de eliminatorias (fecha/hora/sede/código), y asignación de terceros (TDD).
- `src/lib/scoring.ts`, `src/lib/locking.ts`, `src/lib/ranking.ts` — sin cambios.

**Backend (API routes):**
- `src/app/api/standings/route.ts` — GET posiciones públicas.
- `src/app/api/matches/route.ts` — MODIFICAR: incluir puntos del jugador por partido.
- `src/app/api/admin/result/route.ts` — MODIFICAR: aceptar `ganador`.
- `src/app/api/admin/knockout/route.ts` — GET preview clasificados + POST generar ronda.

**Frontend (componentes + páginas):**
- `src/components/Bandera.tsx`, `FechaHoraLocal.tsx`, `TarjetaPartido.tsx`, `TablaGrupo.tsx`, `Bracket.tsx`, `Podio.tsx`, `Tabs.tsx`.
- `src/app/page.tsx` (login), `src/app/jugar/page.tsx`, `src/app/ranking/page.tsx`, `src/app/admin/page.tsx` — reescritura.

**Migración BD:**
- `supabase/migracion-eliminatorias.sql`.

---

## Task 1: Datos de equipos (nombre↔ISO) y URL de bandera

**Files:** Create: `src/lib/equipos.ts`, `src/lib/equipos.test.ts`

- [ ] **Step 1: Test que falla**

Create `src/lib/equipos.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isoDeEquipo, flagUrl } from "./equipos";

describe("equipos", () => {
  it("devuelve ISO de equipos conocidos", () => {
    expect(isoDeEquipo("Argentina")).toBe("ar");
    expect(isoDeEquipo("Brasil")).toBe("br");
    expect(isoDeEquipo("Inglaterra")).toBe("gb-eng");
    expect(isoDeEquipo("Escocia")).toBe("gb-sct");
  });
  it("devuelve null para desconocidos", () => {
    expect(isoDeEquipo("Atlántida")).toBeNull();
  });
  it("construye la URL de bandera flagcdn", () => {
    expect(flagUrl("Argentina")).toBe("https://flagcdn.com/ar.svg");
  });
  it("URL null si no hay ISO", () => {
    expect(flagUrl("Atlántida")).toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- equipos`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

Create `src/lib/equipos.ts`:
```ts
// Mapa de los 48 equipos del Mundial 2026 a su código ISO 3166-1 alpha-2 (para flagcdn).
// Inglaterra y Escocia usan los códigos de subdivisión que soporta flagcdn.
export const EQUIPOS: Record<string, string> = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Canadá": "ca", "Bosnia y Herzegovina": "ba", "Catar": "qa", "Suiza": "ch",
  "Estados Unidos": "us", "Paraguay": "py", "Brasil": "br", "Marruecos": "ma",
  "Haití": "ht", "Escocia": "gb-sct", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curazao": "cw", "Costa de Marfil": "ci", "Ecuador": "ec",
  "Países Bajos": "nl", "Japón": "jp", "Suecia": "se", "Túnez": "tn",
  "Bélgica": "be", "Egipto": "eg", "Irán": "ir", "Nueva Zelanda": "nz",
  "España": "es", "Cabo Verde": "cv", "Arabia Saudita": "sa", "Uruguay": "uy",
  "Francia": "fr", "Senegal": "sn", "Irak": "iq", "Noruega": "no",
  "Argentina": "ar", "Argelia": "dz", "Austria": "at", "Jordania": "jo",
  "Portugal": "pt", "RD Congo": "cd", "Uzbekistán": "uz", "Colombia": "co",
  "Inglaterra": "gb-eng", "Croacia": "hr", "Ghana": "gh", "Panamá": "pa",
};

export function isoDeEquipo(nombre: string): string | null {
  return EQUIPOS[nombre] ?? null;
}

export function flagUrl(nombre: string): string | null {
  const iso = isoDeEquipo(nombre);
  return iso ? `https://flagcdn.com/${iso}.svg` : null;
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test -- equipos`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/equipos.ts src/lib/equipos.test.ts
git commit -m "feat: mapa de equipos a ISO + URL de banderas"
```

---

## Task 2: Cálculo de posiciones por grupo (TDD)

**Files:** Create: `src/lib/standings.ts`, `src/lib/standings.test.ts`

- [ ] **Step 1: Test que falla**

Create `src/lib/standings.test.ts`:
```ts
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
    expect(t[0].equipo).toBe("México"); // 9 pts
    expect(t[0].pts).toBe(9);
    expect(t[0].pj).toBe(3);
    expect(t[0].dg).toBe(6);
    expect(t.map((x) => x.equipo)).toEqual(["México", "Sudáfrica", "Corea del Sur", "Chequia"]);
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
    // Tercero de A = Corea del Sur (3 pts), tercero de B = Bosnia (1 pt)
    expect(terceros[0].equipo).toBe("Corea del Sur");
    expect(terceros[0].grupo).toBe("A");
    expect(terceros[1].grupo).toBe("B");
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- standings`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/lib/standings.ts`:
```ts
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
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test -- standings`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/standings.ts src/lib/standings.test.ts
git commit -m "feat: cálculo de posiciones por grupo y ranking de terceros"
```

---

## Task 3: Estructura del cuadro de eliminatorias y calendario (TDD)

**Files:** Create: `src/lib/bracket.ts`, `src/lib/bracket.test.ts`

**Contexto:** Datos del PDF oficial FIFA. Horas en hora de España (CEST) convertidas a UTC (−2h). Números de partido oficiales: R32 = 73–88 (orden cronológico), octavos 89–96, cuartos 97–100, semis 101–102, 3er puesto 103, final 104.

- [ ] **Step 1: Test que falla**

Create `src/lib/bracket.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { DIECISEISAVOS, RONDAS_SIGUIENTES, asignarTerceros } from "./bracket";

describe("estructura del bracket", () => {
  it("tiene 16 partidos de dieciseisavos con códigos 73-88", () => {
    expect(DIECISEISAVOS).toHaveLength(16);
    expect(DIECISEISAVOS[0].codigo).toBe(73);
    expect(DIECISEISAVOS[0].local).toBe("2A");
    expect(DIECISEISAVOS[0].visitante).toBe("2B");
    expect(DIECISEISAVOS[6].local).toBe("1A"); // partido 79
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
    // 8 grupos cuyos terceros clasifican
    const grupos = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const asign = asignarTerceros(grupos);
    // Devuelve un mapa ranura→grupo, 8 entradas, cada grupo usado una vez
    expect(Object.keys(asign)).toHaveLength(8);
    expect(new Set(Object.values(asign)).size).toBe(8);
    grupos.forEach((g) => expect(Object.values(asign)).toContain(g));
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npm test -- bracket`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/lib/bracket.ts`. Incluye: (a) los 16 dieciseisavos con código, feeders y fecha/hora UTC/sede; (b) rondas siguientes con feeders por número de partido; (c) la función `asignarTerceros`.

```ts
export type FaseElim = "dieciseisavos" | "octavos" | "cuartos" | "semis" | "tercer_puesto" | "final";

export type LlaveBase = {
  codigo: number;
  fase: FaseElim;
  local: string;   // placeholder: "1A", "2B", "3CEFHI", o "W73"/"RU101"
  visitante: string;
  fechaHora: string; // UTC
  sede: string;
};

// Dieciseisavos (R32) — números 73..88 en orden cronológico (PDF FIFA, hora España −2h = UTC).
export const DIECISEISAVOS: LlaveBase[] = [
  { codigo: 73, fase: "dieciseisavos", local: "2A", visitante: "2B", fechaHora: "2026-06-28T19:00:00+00", sede: "Los Ángeles" },
  { codigo: 74, fase: "dieciseisavos", local: "1C", visitante: "2F", fechaHora: "2026-06-29T17:00:00+00", sede: "Houston" },
  { codigo: 75, fase: "dieciseisavos", local: "1E", visitante: "3ABCDF", fechaHora: "2026-06-29T20:30:00+00", sede: "Boston" },
  { codigo: 76, fase: "dieciseisavos", local: "1F", visitante: "2C", fechaHora: "2026-06-30T01:00:00+00", sede: "Monterrey" },
  { codigo: 77, fase: "dieciseisavos", local: "2E", visitante: "2I", fechaHora: "2026-06-30T17:00:00+00", sede: "Dallas" },
  { codigo: 78, fase: "dieciseisavos", local: "1I", visitante: "3CDFGH", fechaHora: "2026-06-30T21:00:00+00", sede: "Nueva York/Nueva Jersey" },
  { codigo: 79, fase: "dieciseisavos", local: "1A", visitante: "3CEFHI", fechaHora: "2026-07-01T01:00:00+00", sede: "Ciudad de México" },
  { codigo: 80, fase: "dieciseisavos", local: "1L", visitante: "3EHIJK", fechaHora: "2026-07-01T16:00:00+00", sede: "Atlanta" },
  { codigo: 81, fase: "dieciseisavos", local: "1G", visitante: "3AEHIJ", fechaHora: "2026-07-01T20:00:00+00", sede: "Seattle" },
  { codigo: 82, fase: "dieciseisavos", local: "1D", visitante: "3BEFIJ", fechaHora: "2026-07-02T00:00:00+00", sede: "Área de la Bahía de San Francisco" },
  { codigo: 83, fase: "dieciseisavos", local: "1H", visitante: "2J", fechaHora: "2026-07-02T19:00:00+00", sede: "Los Ángeles" },
  { codigo: 84, fase: "dieciseisavos", local: "2K", visitante: "2L", fechaHora: "2026-07-02T23:00:00+00", sede: "Toronto" },
  { codigo: 85, fase: "dieciseisavos", local: "1B", visitante: "3EFGIJ", fechaHora: "2026-07-03T03:00:00+00", sede: "Vancouver" },
  { codigo: 86, fase: "dieciseisavos", local: "2D", visitante: "2G", fechaHora: "2026-07-03T18:00:00+00", sede: "Dallas" },
  { codigo: 87, fase: "dieciseisavos", local: "1J", visitante: "2H", fechaHora: "2026-07-03T22:00:00+00", sede: "Miami" },
  { codigo: 88, fase: "dieciseisavos", local: "1K", visitante: "3DEIJL", fechaHora: "2026-07-04T01:30:00+00", sede: "Kansas City" },
];

// Rondas siguientes: feeders por número de partido (W73 = ganador del partido 73).
export const RONDAS_SIGUIENTES: LlaveBase[] = [
  { codigo: 89, fase: "octavos", local: "W73", visitante: "W75", fechaHora: "2026-07-04T17:00:00+00", sede: "Houston" },
  { codigo: 90, fase: "octavos", local: "W74", visitante: "W77", fechaHora: "2026-07-04T21:00:00+00", sede: "Filadelfia" },
  { codigo: 91, fase: "octavos", local: "W76", visitante: "W78", fechaHora: "2026-07-05T20:00:00+00", sede: "Nueva York/Nueva Jersey" },
  { codigo: 92, fase: "octavos", local: "W79", visitante: "W80", fechaHora: "2026-07-06T00:00:00+00", sede: "Ciudad de México" },
  { codigo: 93, fase: "octavos", local: "W83", visitante: "W84", fechaHora: "2026-07-06T19:00:00+00", sede: "Dallas" },
  { codigo: 94, fase: "octavos", local: "W81", visitante: "W82", fechaHora: "2026-07-07T00:00:00+00", sede: "Seattle" },
  { codigo: 95, fase: "octavos", local: "W86", visitante: "W88", fechaHora: "2026-07-07T16:00:00+00", sede: "Atlanta" },
  { codigo: 96, fase: "octavos", local: "W85", visitante: "W87", fechaHora: "2026-07-07T20:00:00+00", sede: "Vancouver" },
  { codigo: 97, fase: "cuartos", local: "W89", visitante: "W90", fechaHora: "2026-07-09T20:00:00+00", sede: "Boston" },
  { codigo: 98, fase: "cuartos", local: "W93", visitante: "W94", fechaHora: "2026-07-10T19:00:00+00", sede: "Los Ángeles" },
  { codigo: 99, fase: "cuartos", local: "W91", visitante: "W92", fechaHora: "2026-07-11T21:00:00+00", sede: "Miami" },
  { codigo: 100, fase: "cuartos", local: "W95", visitante: "W96", fechaHora: "2026-07-12T01:00:00+00", sede: "Kansas City" },
  { codigo: 101, fase: "semis", local: "W97", visitante: "W98", fechaHora: "2026-07-14T19:00:00+00", sede: "Dallas" },
  { codigo: 102, fase: "semis", local: "W99", visitante: "W100", fechaHora: "2026-07-15T19:00:00+00", sede: "Atlanta" },
  { codigo: 103, fase: "tercer_puesto", local: "RU101", visitante: "RU102", fechaHora: "2026-07-18T21:00:00+00", sede: "Miami" },
  { codigo: 104, fase: "final", local: "W101", visitante: "W102", fechaHora: "2026-07-19T19:00:00+00", sede: "Nueva York/Nueva Jersey" },
];

// Ranuras de "tercer" en dieciseisavos y los grupos elegibles de cada una (del PDF).
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
 * Heurística determinista (asignación factible por elegibilidad). El admin
 * confirma/ajusta el resultado antes de publicar (red de seguridad ante la
 * tabla oficial FIFA). Devuelve { ranura: grupo }.
 */
export function asignarTerceros(gruposClasificados: string[]): Record<string, string> {
  const grupos = [...gruposClasificados];
  const ranuras = [...RANURAS_TERCEROS].sort((a, b) => a.elegibles.length - b.elegibles.length);
  const usado = new Set<string>();
  const res: Record<string, string> = {};
  // Backtracking simple: asigna primero las ranuras más restringidas.
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
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test -- bracket`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/bracket.ts src/lib/bracket.test.ts
git commit -m "feat: estructura del cuadro de eliminatorias, calendario y asignación de terceros"
```

> **Nota:** la heurística de `asignarTerceros` produce una asignación factible que el admin confirma. Si se desea la tabla oficial FIFA exacta, sustituir el cuerpo por el lookup oficial sin cambiar la firma. Documentado como riesgo aceptado en el spec.

---

## Task 4: Migración de base de datos

**Files:** Create: `supabase/migracion-eliminatorias.sql`

- [ ] **Step 1: Escribir la migración**

Create `supabase/migracion-eliminatorias.sql`:
```sql
-- Añade el valor 'dieciseisavos' al enum de fases (Round of 32 del Mundial 2026).
alter type fase_t add value if not exists 'dieciseisavos';

-- Columnas para eliminatorias.
alter table partido add column if not exists ganador text;  -- equipo que avanza (penales)
alter table partido add column if not exists codigo int;    -- nº oficial de partido (73..104) para el bracket
```

- [ ] **Step 2: Aplicar en Supabase**

Manual: Supabase → SQL Editor → ejecutar `supabase/migracion-eliminatorias.sql`. Documentar en el README. (`add value` no puede ejecutarse dentro de una transacción con otros usos del enum en algunas versiones; ejecutar el `alter type` solo primero si Supabase se queja.)

- [ ] **Step 3: Commit**
```bash
git add supabase/migracion-eliminatorias.sql
git commit -m "feat: migración BD para eliminatorias (enum dieciseisavos, ganador, codigo)"
```

---

## Task 5: Endpoint GET /api/standings

**Files:** Create: `src/app/api/standings/route.ts`

- [ ] **Step 1: Implementar**

Create `src/app/api/standings/route.ts`:
```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tablaGrupo, rankingTerceros, PartidoResultado } from "@/lib/standings";

const GRUPOS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export async function GET() {
  const { data: partidos } = await supabase
    .from("partido")
    .select("equipo_local, equipo_visitante, goles_local_real, goles_visitante_real, fase")
    .eq("fase", "grupos")
    .eq("estado", "finalizado");

  // Inferir grupo: no está en la fila; lo derivamos de un mapa equipo→grupo construido
  // a partir de los partidos de grupos (cada equipo pertenece a un único grupo).
  // Para simplificar, traemos también todos los partidos de grupos para conocer la pertenencia.
  const { data: todos } = await supabase
    .from("partido")
    .select("equipo_local, equipo_visitante, jornada")
    .eq("fase", "grupos");

  // El grupo no está modelado en BD; se infiere por la lista fija de equipos por grupo.
  // Mapa equipo→grupo embebido (de la carga oficial).
  const equipoGrupo = MAPA_EQUIPO_GRUPO;

  const resultados: PartidoResultado[] = (partidos ?? [])
    .filter((p) => p.goles_local_real != null && p.goles_visitante_real != null)
    .map((p) => ({
      grupo: equipoGrupo[p.equipo_local] ?? "?",
      local: p.equipo_local, visitante: p.equipo_visitante,
      gl: p.goles_local_real as number, gv: p.goles_visitante_real as number,
    }));

  const tablas = GRUPOS.map((g) => ({ grupo: g, filas: tablaGrupo(g, resultados) }));
  const terceros = rankingTerceros(GRUPOS, resultados);
  return NextResponse.json({ tablas, terceros });
}

// Mapa equipo→grupo (de la carga oficial de los 72 partidos).
const MAPA_EQUIPO_GRUPO: Record<string, string> = {
  "México":"A","Sudáfrica":"A","Corea del Sur":"A","Chequia":"A",
  "Canadá":"B","Bosnia y Herzegovina":"B","Catar":"B","Suiza":"B",
  "Brasil":"C","Marruecos":"C","Haití":"C","Escocia":"C",
  "Estados Unidos":"D","Paraguay":"D","Australia":"D","Turquía":"D",
  "Alemania":"E","Curazao":"E","Costa de Marfil":"E","Ecuador":"E",
  "Países Bajos":"F","Japón":"F","Suecia":"F","Túnez":"F",
  "Bélgica":"G","Egipto":"G","Irán":"G","Nueva Zelanda":"G",
  "España":"H","Cabo Verde":"H","Arabia Saudita":"H","Uruguay":"H",
  "Francia":"I","Senegal":"I","Irak":"I","Noruega":"I",
  "Argentina":"J","Argelia":"J","Austria":"J","Jordania":"J",
  "Portugal":"K","RD Congo":"K","Uzbekistán":"K","Colombia":"K",
  "Inglaterra":"L","Croacia":"L","Ghana":"L","Panamá":"L",
};
```

> Nota: `todos` se selecciona por si se necesita en el futuro, pero la pertenencia a grupo se resuelve con `MAPA_EQUIPO_GRUPO`. Eliminar la consulta `todos` si el revisor la considera innecesaria (YAGNI) — es aceptable quitarla.

- [ ] **Step 2: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/standings/route.ts
git commit -m "feat: API de posiciones por grupo y terceros"
```

---

## Task 6: Extender /api/matches con puntos del jugador

**Files:** Modify: `src/app/api/matches/route.ts`

- [ ] **Step 1: Modificar el endpoint**

En `src/app/api/matches/route.ts`, la consulta de pronósticos debe incluir `puntos_obtenidos`, y `miPronostico` debe exponerlo. Reemplazar el bloque de pronósticos y el `map` por:
```ts
  const { data: pronos } = await supabase
    .from("pronostico")
    .select("partido_id, goles_local_pred, goles_visitante_pred, puntos_obtenidos")
    .eq("jugador_id", jugadorId);

  const fechas: PartidoFecha[] = (partidos ?? []).map((p) => ({
    jornada: p.jornada,
    fechaHora: p.fecha_hora,
  }));

  const ahora = new Date();
  const enriquecidos = (partidos ?? []).map((p) => ({
    ...p,
    cerrado: p.estado !== "abierto" || jornadaCerrada(p.jornada, fechas, ahora),
    miPronostico: (pronos ?? []).find((x) => x.partido_id === p.id) ?? null,
  }));
```
(`miPronostico` ahora incluye `puntos_obtenidos` automáticamente por venir en el select.)

- [ ] **Step 2: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/matches/route.ts
git commit -m "feat: /api/matches incluye puntos del jugador por partido"
```

---

## Task 7: Extender /api/admin/result con `ganador`

**Files:** Modify: `src/app/api/admin/result/route.ts`

- [ ] **Step 1: Modificar**

En `src/app/api/admin/result/route.ts`, aceptar `ganador` opcional y guardarlo. Tras parsear el body:
```ts
  const { partidoId, golesLocal, golesVisitante, ganador } = await req.json();
```
Y en el `update` del partido añadir el campo:
```ts
  const { error: errPartido } = await supabase
    .from("partido")
    .update({
      goles_local_real: golesLocal,
      goles_visitante_real: golesVisitante,
      estado: "finalizado",
      ganador: ganador ?? null,
    })
    .eq("id", partidoId);
```
(El resto —validación de goles, recálculo de puntos— se mantiene igual.)

- [ ] **Step 2: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/admin/result/route.ts
git commit -m "feat: carga de resultado admite ganador (avance en eliminatorias)"
```

---

## Task 8: Endpoints admin de eliminatorias (preview + generar)

**Files:** Create: `src/app/api/admin/knockout/route.ts`

**Contexto:** `GET` devuelve los clasificados propuestos (1º/2º por grupo + terceros asignados) para la ronda de dieciseisavos, resolviendo placeholders. `POST` recibe la lista final de partidos a crear (ya confirmada/ajustada por el admin) y los inserta.

- [ ] **Step 1: Implementar**

Create `src/app/api/admin/knockout/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../_auth";
import { tablaGrupo, rankingTerceros, PartidoResultado } from "@/lib/standings";
import { DIECISEISAVOS, RONDAS_SIGUIENTES, asignarTerceros } from "@/lib/bracket";

const GRUPOS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const MAPA_EQUIPO_GRUPO: Record<string, string> = {
  "México":"A","Sudáfrica":"A","Corea del Sur":"A","Chequia":"A",
  "Canadá":"B","Bosnia y Herzegovina":"B","Catar":"B","Suiza":"B",
  "Brasil":"C","Marruecos":"C","Haití":"C","Escocia":"C",
  "Estados Unidos":"D","Paraguay":"D","Australia":"D","Turquía":"D",
  "Alemania":"E","Curazao":"E","Costa de Marfil":"E","Ecuador":"E",
  "Países Bajos":"F","Japón":"F","Suecia":"F","Túnez":"F",
  "Bélgica":"G","Egipto":"G","Irán":"G","Nueva Zelanda":"G",
  "España":"H","Cabo Verde":"H","Arabia Saudita":"H","Uruguay":"H",
  "Francia":"I","Senegal":"I","Irak":"I","Noruega":"I",
  "Argentina":"J","Argelia":"J","Austria":"J","Jordania":"J",
  "Portugal":"K","RD Congo":"K","Uzbekistán":"K","Colombia":"K",
  "Inglaterra":"L","Croacia":"L","Ghana":"L","Panamá":"L",
};

async function resultadosGrupos(): Promise<PartidoResultado[]> {
  const { data } = await supabase
    .from("partido")
    .select("equipo_local, equipo_visitante, goles_local_real, goles_visitante_real")
    .eq("fase", "grupos").eq("estado", "finalizado");
  return (data ?? [])
    .filter((p) => p.goles_local_real != null && p.goles_visitante_real != null)
    .map((p) => ({
      grupo: MAPA_EQUIPO_GRUPO[p.equipo_local] ?? "?",
      local: p.equipo_local, visitante: p.equipo_visitante,
      gl: p.goles_local_real as number, gv: p.goles_visitante_real as number,
    }));
}

// GET: propone los 16 cruces de dieciseisavos con equipos reales.
export async function GET(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const res = await resultadosGrupos();
  const finalizados = res.length;
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  for (const g of GRUPOS) {
    const t = tablaGrupo(g, res);
    if (t[0]) primeros[g] = t[0].equipo;
    if (t[1]) segundos[g] = t[1].equipo;
  }
  const terceros = rankingTerceros(GRUPOS, res).slice(0, 8);
  const gruposTerceros = terceros.map((t) => t.grupo);
  const asign = asignarTerceros(gruposTerceros); // { ranura: grupo }
  const terceroDe: Record<string, string> = {};
  for (const t of terceros) terceroDe[t.grupo] = t.equipo;

  const resolver = (ph: string): string => {
    if (ph.startsWith("1")) return primeros[ph[1]] ?? ph;
    if (ph.startsWith("2")) return segundos[ph[1]] ?? ph;
    if (ph.startsWith("3")) {
      const grupo = asign[ph]; // ranura completa, p.ej. "3ABCDF"
      return grupo ? (terceroDe[grupo] ?? ph) : ph;
    }
    return ph;
  };

  const cruces = DIECISEISAVOS.map((d) => ({
    codigo: d.codigo, fase: d.fase, fechaHora: d.fechaHora, sede: d.sede,
    localPlaceholder: d.local, visitantePlaceholder: d.visitante,
    local: resolver(d.local), visitante: resolver(d.visitante),
  }));

  return NextResponse.json({ listo: finalizados === 72, finalizados, cruces });
}

// POST: crea filas de partido para una ronda. Body: { partidos: [{codigo,fase,local,visitante,fechaHora}] }
export async function POST(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { partidos } = await req.json();
  const { data: sala } = await supabase.from("sala").select("id").limit(1).single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  const filas = (partidos ?? []).map((p: { codigo: number; fase: string; local: string; visitante: string; fechaHora: string }) => ({
    sala_id: sala.id,
    equipo_local: p.local,
    equipo_visitante: p.visitante,
    fecha_hora: p.fechaHora,
    fase: p.fase,
    jornada: p.codigo, // jornada única = nº oficial de partido (cierre por partido)
    codigo: p.codigo,
    estado: "abierto",
  }));
  const { error } = await supabase.from("partido").insert(filas);
  if (error) return NextResponse.json({ error: "No se pudo crear: " + error.message }, { status: 500 });
  return NextResponse.json({ ok: true, creados: filas.length });
}

export { RONDAS_SIGUIENTES };
```

> Nota: para rondas posteriores (octavos→final) el admin envía el `POST` con los partidos resueltos a partir de `RONDAS_SIGUIENTES` y los `ganador` ya cargados; la resolución de `W##`/`RU##` a equipos reales se hace en la UI admin (Task 14) leyendo los `ganador` de los partidos previos. Mantener este endpoint genérico (recibe partidos ya resueltos).

- [ ] **Step 2: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/admin/knockout/route.ts
git commit -m "feat: API admin de eliminatorias (preview de cruces y generación de ronda)"
```

---

## Task 9: Componentes base — Bandera y FechaHoraLocal

**Files:** Create: `src/components/Bandera.tsx`, `src/components/FechaHoraLocal.tsx`

**Usar el skill `frontend-design` para el detalle visual.** Requisitos concretos:

- [ ] **Step 1: Bandera**

Create `src/components/Bandera.tsx`:
```tsx
import { flagUrl } from "@/lib/equipos";

export function Bandera({ equipo, size = 24 }: { equipo: string; size?: number }) {
  const url = flagUrl(equipo);
  if (!url) {
    return (
      <span
        className="inline-flex items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-600"
        style={{ width: size * 1.4, height: size }}
        aria-label={equipo}
      >
        {equipo.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={equipo} width={size * 1.4} height={size}
      className="inline-block rounded object-cover shadow-sm" style={{ height: size }} />
  );
}
```

- [ ] **Step 2: FechaHoraLocal**

Create `src/components/FechaHoraLocal.tsx`:
```tsx
"use client";

export function FechaHoraLocal({ iso }: { iso: string }) {
  const d = new Date(iso);
  const txt = new Intl.DateTimeFormat("es", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
  return <time dateTime={iso} className="tabular-nums">{txt}</time>;
}
```

- [ ] **Step 3: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**
```bash
git add src/components/Bandera.tsx src/components/FechaHoraLocal.tsx
git commit -m "feat: componentes Bandera y FechaHoraLocal"
```

---

## Task 10: Componentes de jugador — TarjetaPartido y TablaGrupo

**Files:** Create: `src/components/TarjetaPartido.tsx`, `src/components/TablaGrupo.tsx`

**Usar el skill `frontend-design`.** Estética "Vistosa Mundial": tarjetas con sombra suave, banderas, badges de puntos coloridos. Mobile-first.

- [ ] **Step 1: TarjetaPartido**

`TarjetaPartido` recibe el partido enriquecido y los controladores. Estructura/props EXACTAS:
```tsx
"use client";
import { Bandera } from "./Bandera";
import { FechaHoraLocal } from "./FechaHoraLocal";

export type PartidoUI = {
  id: string; equipo_local: string; equipo_visitante: string;
  fecha_hora: string; fase: string; jornada: number; cerrado: boolean;
  goles_local_real: number | null; goles_visitante_real: number | null;
  miPronostico: { goles_local_pred: number; goles_visitante_pred: number; puntos_obtenidos: number } | null;
};

export function TarjetaPartido({
  p, valor, onChange, onGuardar,
}: {
  p: PartidoUI;
  valor: { local: string; visitante: string };
  onChange: (campo: "local" | "visitante", v: string) => void;
  onGuardar: () => void;
}) {
  const jugado = p.goles_local_real != null && p.goles_visitante_real != null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="mb-1 text-center text-[11px] font-medium text-gray-400">
        <FechaHoraLocal iso={p.fecha_hora} />{p.cerrado && !jugado && " · cerrado"}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center justify-end gap-2 text-right text-sm font-medium">
          <span>{p.equipo_local}</span><Bandera equipo={p.equipo_local} />
        </div>
        {/* inputs si abierto; marcador real si jugado */}
        {jugado ? (
          <div className="flex items-center gap-1 font-bold tabular-nums">
            <span>{p.goles_local_real}</span><span>-</span><span>{p.goles_visitante_real}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input type="number" min={0} inputMode="numeric" disabled={p.cerrado}
              className="w-10 rounded-lg border border-gray-200 p-1 text-center disabled:bg-gray-100"
              value={valor.local} onChange={(e) => onChange("local", e.target.value)} onBlur={onGuardar} />
            <span>-</span>
            <input type="number" min={0} inputMode="numeric" disabled={p.cerrado}
              className="w-10 rounded-lg border border-gray-200 p-1 text-center disabled:bg-gray-100"
              value={valor.visitante} onChange={(e) => onChange("visitante", e.target.value)} onBlur={onGuardar} />
          </div>
        )}
        <div className="flex flex-1 items-center gap-2 text-sm font-medium">
          <Bandera equipo={p.equipo_visitante} /><span>{p.equipo_visitante}</span>
        </div>
      </div>
      {/* Pie: tu pronóstico + puntos cuando ya se jugó */}
      {jugado && p.miPronostico && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Tu pronóstico: {p.miPronostico.goles_local_pred}-{p.miPronostico.goles_visitante_pred}</span>
          <span className={
            "rounded-full px-2 py-0.5 font-semibold " +
            (p.miPronostico.puntos_obtenidos === 2 ? "bg-green-100 text-green-700"
              : p.miPronostico.puntos_obtenidos === 1 ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-500")
          }>+{p.miPronostico.puntos_obtenidos}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TablaGrupo**

`TablaGrupo` recibe `{ grupo, filas }` (de /api/standings) y muestra la tabla con banderas; resalta filas 1–2 (verde suave) y 3 (ámbar suave). Implementar con el skill frontend-design respetando estas columnas: Pos, Equipo(bandera+nombre), PJ, DG, Pts (en móvil mostrar solo Pos/Equipo/PJ/DG/Pts; PJ/G/E/P/GF/GC en pantallas grandes). Tipo de fila:
```tsx
type FilaTabla = { grupo: string; equipo: string; pj: number; g: number; e: number; p: number; gf: number; gc: number; dg: number; pts: number };
```

- [ ] **Step 3: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**
```bash
git add src/components/TarjetaPartido.tsx src/components/TablaGrupo.tsx
git commit -m "feat: componentes TarjetaPartido y TablaGrupo (estilo Mundial)"
```

---

## Task 11: Componentes Bracket y Podio

**Files:** Create: `src/components/Bracket.tsx`, `src/components/Podio.tsx`

**Usar el skill `frontend-design`.**

- [ ] **Step 1: Bracket**

`Bracket` recibe la lista de partidos de eliminatoria (los que existan en BD) + la estructura base (`DIECISEISAVOS`+`RONDAS_SIGUIENTES` de `@/lib/bracket`) para dibujar columnas por fase (Dieciseisavos, Octavos, Cuartos, Semis, Final). Cada llave muestra: si existe partido real → banderas+nombres (+ inputs de pronóstico si abierto, o resultado+puntos si jugado, reutilizando `TarjetaPartido` compacta); si no existe aún → placeholders ("1A", "3CEFHI", "Ganador P73") en gris "por definir". Scroll horizontal en móvil. Props:
```tsx
{ partidos: PartidoUI[]; valores: Record<string, {local:string;visitante:string}>;
  onChange: (id:string, campo:"local"|"visitante", v:string)=>void; onGuardar:(id:string)=>void }
```

- [ ] **Step 2: Podio**

`Podio` recibe el top-3 del ranking y lo muestra como podio (2º-1º-3º), con medallas y puntos. Tipo:
```tsx
type FilaRanking = { nombre: string; puntos: number; exactos: number };
```

- [ ] **Step 3: Verificar build**

Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**
```bash
git add src/components/Bracket.tsx src/components/Podio.tsx
git commit -m "feat: componentes Bracket y Podio"
```

---

## Task 12: Página de login restyle

**Files:** Modify: `src/app/page.tsx`

**Usar el skill `frontend-design`.** Mantener la MISMA lógica (POST /api/join, guardar jugadorId/nombre en localStorage, push a /jugar) y los mismos campos (codigo, nombre, pin 4 dígitos). Cambiar solo la estética: fondo con degradado tipo Mundial, tarjeta centrada, título "Quiniela Mundial 2026", inputs redondeados grandes, botón llamativo. No cambiar nombres de campos ni el flujo.

- [ ] **Step 1: Reescribir la UI manteniendo la lógica** (ver `src/app/page.tsx` actual como referencia de la lógica `entrar()`).
- [ ] **Step 2: Build** — `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` → OK.
- [ ] **Step 3: Commit** — `git add src/app/page.tsx && git commit -m "feat: login con estilo Mundial"`

---

## Task 13: Página del jugador con pestañas (Grupos / Eliminatorias / Ranking)

**Files:** Modify: `src/app/jugar/page.tsx`; Create: `src/components/Tabs.tsx`

**Usar el skill `frontend-design`.**

- [ ] **Step 1: Tabs** — componente simple de pestañas controladas (`{ tabs: string[]; activo: string; onChange }`).

- [ ] **Step 2: Reescribir `jugar/page.tsx`** con:
  - Carga: `GET /api/matches?jugadorId=` (partidos con puntos) y `GET /api/standings` (tablas).
  - Estado `marcadores` por partido (como hoy) para autosave vía `POST /api/predictions`.
  - Pestaña **Grupos**: para cada grupo A–L, `TablaGrupo` + las `TarjetaPartido` de ese grupo (filtrando por `MAPA_EQUIPO_GRUPO`; reutilizar el mapa en `src/lib/equipos.ts` exportándolo allí para no duplicar — añadir `export const GRUPO_DE_EQUIPO` en `equipos.ts`).
  - Pestaña **Eliminatorias**: `Bracket` con los partidos de fase ≠ grupos.
  - Pestaña **Ranking**: `GET /api/ranking` → `Podio` + tabla.
  - Header con nombre del jugador (localStorage) y botón salir (limpia localStorage → `/`).

  > Para evitar duplicar el mapa equipo→grupo, añadir en `src/lib/equipos.ts`:
  > ```ts
  > export const GRUPO_DE_EQUIPO: Record<string,string> = { /* mismos 48 pares A..L */ };
  > ```
  > y usarlo tanto aquí como en los endpoints (Task 5 y 8 pueden importar de aquí en vez de redefinir; si el revisor lo prefiere, refactorizar esos endpoints para importar `GRUPO_DE_EQUIPO` — mejora DRY).

- [ ] **Step 3: Build** → OK.
- [ ] **Step 4: Commit** — `git add src/app/jugar/page.tsx src/components/Tabs.tsx src/lib/equipos.ts && git commit -m "feat: app del jugador con pestañas grupos/eliminatorias/ranking"`

---

## Task 14: Panel admin — tablero de partidos con filtros y carga inline

**Files:** Modify: `src/app/admin/page.tsx`

**Usar el skill `frontend-design`.** Mantener login (POST /api/admin/login) y header `x-admin-clave`.

- [ ] **Step 1: Reescribir el panel** con tres secciones (pestañas o acordeón):
  - **Partidos:** `GET /api/admin/matches` → tabla de todos los partidos con banderas, `FechaHoraLocal`, fase, y, por fila, inputs de marcador + (si fase ≠ grupos) selector de **avanza** (local/visitante, prellenado por marcador) + botón Guardar → `POST /api/admin/result` con `{ partidoId, golesLocal, golesVisitante, ganador }`. **Filtros:** select de fase, input de fecha, checkbox "solo pendientes" (sin `goles_local_real`), buscador por equipo. Filtrado en cliente sobre la lista cargada.
  - **Eliminatorias:** botón "Cargar propuesta" → `GET /api/admin/knockout` (muestra `listo`, `finalizados/72`, y los 16 cruces con equipos resueltos y editables); el admin ajusta equipos de cada cruce y pulsa "Publicar dieciseisavos" → `POST /api/admin/knockout` con `{ partidos: [...] }`. Para rondas siguientes: un botón por ronda (Octavos, Cuartos, Semis, Final/3er puesto) que toma `RONDAS_SIGUIENTES` (importar de `@/lib/bracket`), resuelve `W##`/`RU##` leyendo `ganador`/perdedor de los partidos por `codigo` ya cargados, muestra los cruces editables y publica vía el mismo `POST`.
  - **Ranking:** `GET /api/ranking` → tabla de jugadores con puntos y exactos.

- [ ] **Step 2: Build** → OK.
- [ ] **Step 3: Commit** — `git add src/app/admin/page.tsx && git commit -m "feat: panel admin con tablero, filtros, generación de eliminatorias y ranking"`

---

## Task 15: Página de ranking pública restyle

**Files:** Modify: `src/app/ranking/page.tsx`

**Usar el skill `frontend-design`.** Mantener la lógica (`GET /api/ranking`). Mostrar `Podio` (top 3) + tabla completa con estilo Mundial. Enlace de volver a `/jugar`.

- [ ] **Step 1: Reescribir** usando `Podio`.
- [ ] **Step 2: Build** → OK.
- [ ] **Step 3: Commit** — `git add src/app/ranking/page.tsx && git commit -m "feat: ranking público con podio"`

---

## Task 16: Migración, despliegue y verificación en producción

**Files:** Modify: `README.md`

- [ ] **Step 1: Aplicar la migración** en Supabase (SQL Editor → `supabase/migracion-eliminatorias.sql`).
- [ ] **Step 2: Actualizar README** con la nota de la migración y las nuevas pantallas.
- [ ] **Step 3: Tests + build finales**
  Run: `npm test` (deben pasar equipos+standings+bracket+scoring+locking+ranking).
  Run: `SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` → OK.
- [ ] **Step 4: Commit y push**
  ```bash
  git add README.md
  git commit -m "docs: migración eliminatorias y nuevas pantallas"
  ```
  (El push a `master` lo realiza el controlador/usuario para disparar el auto-deploy en Vercel.)
- [ ] **Step 5: Verificación en producción** (tras el deploy): smoke test de `/api/standings`, alta de jugador de prueba, ver pestañas, cargar un resultado de grupo desde admin y ver puntos+tabla, y limpiar los datos de prueba.

---

## Notas de ejecución
- Cada tarea de frontend DEBE usar el skill `frontend-design` para la calidad visual; el plan fija props, datos y lógica, el skill aporta el diseño.
- No cambiar la lógica de negocio existente (scoring/locking/acceso). Las pruebas de las funciones puras (`scoring`, `locking`, `ranking`, `standings`, `bracket`, `equipos`) deben seguir verdes.
- DRY: el mapa equipo→grupo vive en `src/lib/equipos.ts` (`GRUPO_DE_EQUIPO`); endpoints y páginas lo importan.
