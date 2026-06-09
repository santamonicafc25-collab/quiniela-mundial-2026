# Quiniela Mundial 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una web responsive y gratuita para una quiniela privada del Mundial 2026, donde los jugadores pronostican marcadores (2 pts marcador exacto / 1 pt resultado 1X2) y compiten en un ranking, con un panel de admin oculto para cargar partidos y resultados.

**Architecture:** Next.js (App Router) en Vercel para frontend + API routes serverless. Supabase (Postgres) como base de datos. Lógica de puntuación como función pura testeada con TDD. Acceso de jugadores con nombre + PIN (hash) bajo una sola sala; admin protegido con clave secreta (hash). Sin pagos, sin APIs externas, sin auth de email.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, @supabase/supabase-js, bcryptjs (hash de PIN/clave admin), Vitest (tests de lógica pura).

---

## File Structure

- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `.env.example` — scaffolding y config.
- `supabase/schema.sql` — DDL de las tablas (sala, jugador, partido, pronostico) y datos semilla de la sala.
- `src/lib/supabase.ts` — cliente Supabase (server-side, service role).
- `src/lib/scoring.ts` — función pura de puntuación. **Núcleo TDD.**
- `src/lib/scoring.test.ts` — tests de la función de puntuación.
- `src/lib/locking.ts` — lógica de cierre por jornada (kickoff del primer partido). **TDD.**
- `src/lib/locking.test.ts` — tests de cierre.
- `src/lib/ranking.ts` — cálculo/orden del ranking con desempates. **TDD.**
- `src/lib/ranking.test.ts` — tests de ranking.
- `src/app/api/join/route.ts` — alta/login de jugador (nombre + PIN).
- `src/app/api/matches/route.ts` — GET partidos abiertos + pronósticos del jugador.
- `src/app/api/predictions/route.ts` — POST/PUT pronósticos del jugador.
- `src/app/api/ranking/route.ts` — GET ranking.
- `src/app/api/admin/login/route.ts` — verifica clave admin → token de sesión simple.
- `src/app/api/admin/matches/route.ts` — CRUD de partidos (admin).
- `src/app/api/admin/result/route.ts` — POST resultado real → recalcula puntos.
- `src/app/page.tsx` — pantalla de login del jugador.
- `src/app/jugar/page.tsx` — pantalla de pronósticos.
- `src/app/ranking/page.tsx` — pantalla de ranking.
- `src/app/admin/page.tsx` — panel de administración oculto.
- `README.md` — instrucciones de despliegue en Vercel + Supabase.

---

## Task 1: Scaffolding del proyecto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Crear el proyecto Next.js con TypeScript y Tailwind**

Run (en la raíz del proyecto Quiniela, que ya tiene git inicializado):
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
Cuando pregunte por sobrescribir archivos existentes (git, docs), elegir conservar. Si `create-next-app` rechaza el directorio no vacío, generar en `tmp-app/` y mover el contenido a la raíz preservando `docs/` y `.git/`.

- [ ] **Step 2: Instalar dependencias del proyecto**

Run:
```bash
npm install @supabase/supabase-js bcryptjs
npm install -D vitest @types/bcryptjs
```

- [ ] **Step 3: Configurar Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Añadir a `package.json` en `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verificar que el proyecto arranca**

Run:
```bash
npm run build
```
Expected: build exitoso sin errores de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffolding Next.js + Tailwind + Vitest"
```

---

## Task 2: Lógica de puntuación (función pura, TDD)

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `src/lib/scoring.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/scoring.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { puntosPronostico } from "./scoring";

describe("puntosPronostico", () => {
  it("da 2 puntos si acierta marcador exacto", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 2, visitante: 1 })).toBe(2);
  });

  it("da 1 punto si acierta el resultado (victoria local) pero no el marcador", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 3, visitante: 0 })).toBe(1);
  });

  it("da 1 punto si acierta empate pero no el marcador", () => {
    expect(puntosPronostico({ local: 1, visitante: 1 }, { local: 0, visitante: 0 })).toBe(1);
  });

  it("da 2 puntos en empate con marcador exacto", () => {
    expect(puntosPronostico({ local: 0, visitante: 0 }, { local: 0, visitante: 0 })).toBe(2);
  });

  it("da 0 puntos si falla el resultado", () => {
    expect(puntosPronostico({ local: 2, visitante: 1 }, { local: 0, visitante: 2 })).toBe(0);
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- scoring`
Expected: FAIL — "puntosPronostico is not defined" / módulo no encontrado.

- [ ] **Step 3: Implementar la función mínima**

Create `src/lib/scoring.ts`:
```ts
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
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npm test -- scoring`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: lógica de puntuación (2/1/0) con tests"
```

---

## Task 3: Lógica de cierre por jornada (TDD)

**Files:**
- Create: `src/lib/locking.ts`
- Test: `src/lib/locking.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/locking.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { jornadaCerrada } from "./locking";

const partidos = [
  { jornada: 1, fechaHora: "2026-06-11T16:00:00Z" },
  { jornada: 1, fechaHora: "2026-06-11T19:00:00Z" },
  { jornada: 2, fechaHora: "2026-06-15T16:00:00Z" },
];

describe("jornadaCerrada", () => {
  it("está abierta antes del kickoff del primer partido de la jornada", () => {
    const ahora = new Date("2026-06-11T15:59:00Z");
    expect(jornadaCerrada(1, partidos, ahora)).toBe(false);
  });

  it("está cerrada en el kickoff del primer partido de la jornada", () => {
    const ahora = new Date("2026-06-11T16:00:00Z");
    expect(jornadaCerrada(1, partidos, ahora)).toBe(true);
  });

  it("la jornada 2 sigue abierta aunque la 1 esté cerrada", () => {
    const ahora = new Date("2026-06-11T16:00:00Z");
    expect(jornadaCerrada(2, partidos, ahora)).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- locking`
Expected: FAIL — módulo/función no definida.

- [ ] **Step 3: Implementar la función mínima**

Create `src/lib/locking.ts`:
```ts
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
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npm test -- locking`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/locking.ts src/lib/locking.test.ts
git commit -m "feat: cierre de pronósticos por jornada con tests"
```

---

## Task 4: Lógica de ranking con desempates (TDD)

**Files:**
- Create: `src/lib/ranking.ts`
- Test: `src/lib/ranking.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/ranking.test.ts`:
```ts
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
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- ranking`
Expected: FAIL — función no definida.

- [ ] **Step 3: Implementar la función mínima**

Create `src/lib/ranking.ts`:
```ts
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
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npm test -- ranking`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ranking.ts src/lib/ranking.test.ts
git commit -m "feat: ordenamiento de ranking con desempates y tests"
```

---

## Task 5: Esquema de base de datos (Supabase)

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Escribir el DDL**

Create `supabase/schema.sql`:
```sql
-- Una sola sala (quiniela). codigo_acceso y clave_admin_hash se setean al desplegar.
create table sala (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Quiniela Mundial 2026',
  codigo_acceso text not null,
  clave_admin_hash text not null
);

create table jugador (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references sala(id),
  nombre text not null,
  pin_hash text not null,
  fecha_registro timestamptz not null default now(),
  unique (sala_id, nombre)
);

create type fase_t as enum ('grupos','octavos','cuartos','semis','tercer_puesto','final');
create type estado_t as enum ('abierto','cerrado','finalizado');

create table partido (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references sala(id),
  equipo_local text not null,
  equipo_visitante text not null,
  fecha_hora timestamptz not null,
  fase fase_t not null,
  jornada int not null,
  goles_local_real int,
  goles_visitante_real int,
  estado estado_t not null default 'abierto'
);

create table pronostico (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references jugador(id),
  partido_id uuid not null references partido(id),
  goles_local_pred int not null,
  goles_visitante_pred int not null,
  puntos_obtenidos int not null default 0,
  unique (jugador_id, partido_id)
);
```

- [ ] **Step 2: Aplicar el esquema en Supabase**

Manual: en el panel de Supabase → SQL Editor → pegar y ejecutar `supabase/schema.sql`. Luego insertar la sala con un código y un hash de clave admin (el hash se genera en Task 6, Step de seed). Documentar este paso en el README (Task 11).

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: esquema de base de datos Supabase"
```

---

## Task 6: Cliente Supabase y variables de entorno

**Files:**
- Create: `src/lib/supabase.ts`, `.env.example`
- Modify: `.env.local` (no se commitea), `.gitignore` (verificar que ignora `.env.local`)

- [ ] **Step 1: Crear `.env.example`**

Create `.env.example`:
```
# URL del proyecto Supabase
SUPABASE_URL=
# Service role key (solo server-side, NUNCA exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: Verificar que `.gitignore` ignora `.env*.local`**

Confirmar que `.gitignore` (generado por create-next-app) contiene `.env*.local`. Si no, añadirlo.

- [ ] **Step 3: Crear el cliente Supabase server-side**

Create `src/lib/supabase.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

// Cliente con service role: solo se usa en API routes (server), nunca en el cliente.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
```

- [ ] **Step 4: Crear `.env.local` local para desarrollo**

Manual: copiar `.env.example` a `.env.local` y rellenar con los valores reales del proyecto Supabase. No se commitea.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts .env.example
git commit -m "feat: cliente Supabase y plantilla de entorno"
```

---

## Task 7: API de jugador — alta/login (nombre + PIN)

**Files:**
- Create: `src/app/api/join/route.ts`

- [ ] **Step 1: Implementar el endpoint de join**

Create `src/app/api/join/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { codigo, nombre, pin } = await req.json();

  if (!codigo || !nombre || !/^\d{4}$/.test(pin ?? "")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: sala } = await supabase
    .from("sala")
    .select("id")
    .eq("codigo_acceso", codigo)
    .single();
  if (!sala) return NextResponse.json({ error: "Código de sala incorrecto" }, { status: 401 });

  const { data: existente } = await supabase
    .from("jugador")
    .select("id, pin_hash")
    .eq("sala_id", sala.id)
    .eq("nombre", nombre)
    .single();

  if (existente) {
    const ok = await bcrypt.compare(pin, existente.pin_hash);
    if (!ok) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    return NextResponse.json({ jugadorId: existente.id, nombre });
  }

  const pin_hash = await bcrypt.hash(pin, 10);
  const { data: nuevo, error } = await supabase
    .from("jugador")
    .insert({ sala_id: sala.id, nombre, pin_hash })
    .select("id")
    .single();
  if (error || !nuevo) {
    return NextResponse.json({ error: "No se pudo crear el jugador" }, { status: 500 });
  }
  return NextResponse.json({ jugadorId: nuevo.id, nombre });
}
```

- [ ] **Step 2: Verificar build de tipos**

Run: `npm run build`
Expected: build exitoso (la ruta compila sin errores de tipos).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/join/route.ts
git commit -m "feat: API join de jugador (alta/login con PIN)"
```

---

## Task 8: API de partidos y pronósticos del jugador

**Files:**
- Create: `src/app/api/matches/route.ts`, `src/app/api/predictions/route.ts`

- [ ] **Step 1: Endpoint GET de partidos + pronósticos del jugador**

Create `src/app/api/matches/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jornadaCerrada, PartidoFecha } from "@/lib/locking";

export async function GET(req: NextRequest) {
  const jugadorId = req.nextUrl.searchParams.get("jugadorId");
  if (!jugadorId) return NextResponse.json({ error: "Falta jugadorId" }, { status: 400 });

  const { data: partidos } = await supabase
    .from("partido")
    .select("*")
    .order("fecha_hora", { ascending: true });

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("partido_id, goles_local_pred, goles_visitante_pred")
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

  return NextResponse.json({ partidos: enriquecidos });
}
```

- [ ] **Step 2: Endpoint POST de pronóstico (con validación de cierre)**

Create `src/app/api/predictions/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jornadaCerrada, PartidoFecha } from "@/lib/locking";

export async function POST(req: NextRequest) {
  const { jugadorId, partidoId, golesLocal, golesVisitante } = await req.json();
  if (!jugadorId || !partidoId || golesLocal == null || golesVisitante == null) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: partido } = await supabase
    .from("partido")
    .select("jornada, estado")
    .eq("id", partidoId)
    .single();
  if (!partido) return NextResponse.json({ error: "Partido no existe" }, { status: 404 });

  const { data: deLaJornada } = await supabase
    .from("partido")
    .select("jornada, fecha_hora")
    .eq("jornada", partido.jornada);
  const fechas: PartidoFecha[] = (deLaJornada ?? []).map((p) => ({
    jornada: p.jornada,
    fechaHora: p.fecha_hora,
  }));

  if (partido.estado !== "abierto" || jornadaCerrada(partido.jornada, fechas)) {
    return NextResponse.json({ error: "La jornada está cerrada" }, { status: 403 });
  }

  const { error } = await supabase
    .from("pronostico")
    .upsert(
      {
        jugador_id: jugadorId,
        partido_id: partidoId,
        goles_local_pred: golesLocal,
        goles_visitante_pred: golesVisitante,
      },
      { onConflict: "jugador_id,partido_id" }
    );
  if (error) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/matches/route.ts src/app/api/predictions/route.ts
git commit -m "feat: API de partidos y pronósticos del jugador"
```

---

## Task 9: API de ranking y de administración

**Files:**
- Create: `src/app/api/ranking/route.ts`, `src/app/api/admin/login/route.ts`, `src/app/api/admin/matches/route.ts`, `src/app/api/admin/result/route.ts`

- [ ] **Step 1: Endpoint GET de ranking**

Create `src/app/api/ranking/route.ts`:
```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ordenarRanking, FilaRanking } from "@/lib/ranking";

export async function GET() {
  const { data: jugadores } = await supabase
    .from("jugador")
    .select("id, nombre, fecha_registro")
    .order("fecha_registro", { ascending: true });

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("jugador_id, puntos_obtenidos");

  const filas: FilaRanking[] = (jugadores ?? []).map((j, idx) => {
    const suyos = (pronos ?? []).filter((p) => p.jugador_id === j.id);
    return {
      nombre: j.nombre,
      puntos: suyos.reduce((s, p) => s + p.puntos_obtenidos, 0),
      exactos: suyos.filter((p) => p.puntos_obtenidos === 2).length,
      registro: idx,
    };
  });

  return NextResponse.json({ ranking: ordenarRanking(filas) });
}
```

- [ ] **Step 2: Endpoint de login admin (verifica clave → token simple)**

Create `src/app/api/admin/login/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { clave } = await req.json();
  const { data: sala } = await supabase
    .from("sala")
    .select("id, clave_admin_hash")
    .limit(1)
    .single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  const ok = await bcrypt.compare(clave ?? "", sala.clave_admin_hash);
  if (!ok) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });

  // Token simple: la propia clave validada se reenvía en cada request admin y se revalida.
  return NextResponse.json({ ok: true });
}

/** Helper reutilizable: valida la clave admin enviada en el header. */
export async function validarAdmin(clave: string | null): Promise<boolean> {
  if (!clave) return false;
  const { data: sala } = await supabase
    .from("sala")
    .select("clave_admin_hash")
    .limit(1)
    .single();
  if (!sala) return false;
  return bcrypt.compare(clave, sala.clave_admin_hash);
}
```

- [ ] **Step 3: Endpoint admin de partidos (crear/listar/abrir cruce)**

Create `src/app/api/admin/matches/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../login/route";

export async function POST(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { data: sala } = await supabase.from("sala").select("id").limit(1).single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  const { error } = await supabase.from("partido").insert({
    sala_id: sala.id,
    equipo_local: body.equipoLocal,
    equipo_visitante: body.equipoVisitante,
    fecha_hora: body.fechaHora,
    fase: body.fase,
    jornada: body.jornada,
    estado: "abierto",
  });
  if (error) return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data } = await supabase
    .from("partido")
    .select("*")
    .order("fecha_hora", { ascending: true });
  return NextResponse.json({ partidos: data ?? [] });
}
```

- [ ] **Step 4: Endpoint admin de resultado (recalcula puntos)**

Create `src/app/api/admin/result/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../login/route";
import { puntosPronostico } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { partidoId, golesLocal, golesVisitante } = await req.json();

  await supabase
    .from("partido")
    .update({
      goles_local_real: golesLocal,
      goles_visitante_real: golesVisitante,
      estado: "finalizado",
    })
    .eq("id", partidoId);

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("id, goles_local_pred, goles_visitante_pred")
    .eq("partido_id", partidoId);

  for (const p of pronos ?? []) {
    const pts = puntosPronostico(
      { local: p.goles_local_pred, visitante: p.goles_visitante_pred },
      { local: golesLocal, visitante: golesVisitante }
    );
    await supabase.from("pronostico").update({ puntos_obtenidos: pts }).eq("id", p.id);
  }

  return NextResponse.json({ ok: true, actualizados: (pronos ?? []).length });
}
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ranking/route.ts src/app/api/admin
git commit -m "feat: API de ranking y panel admin (partidos + resultados con recálculo)"
```

---

## Task 10: Frontend — login, pronósticos, ranking y admin

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/jugar/page.tsx`, `src/app/ranking/page.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1: Pantalla de login del jugador**

Replace `src/app/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function entrar() {
    setError("");
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, nombre, pin }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    localStorage.setItem("jugadorId", data.jugadorId);
    localStorage.setItem("nombre", data.nombre);
    router.push("/jugar");
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Quiniela Mundial 2026</h1>
      <input className="w-full border rounded p-2" placeholder="Código de sala"
        value={codigo} onChange={(e) => setCodigo(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Tu nombre"
        value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="PIN (4 dígitos)" inputMode="numeric"
        maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="w-full bg-blue-600 text-white rounded p-2" onClick={entrar}>
        Entrar
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Pantalla de pronósticos**

Create `src/app/jugar/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Partido = {
  id: string; equipo_local: string; equipo_visitante: string;
  fecha_hora: string; fase: string; jornada: number; cerrado: boolean;
  miPronostico: { goles_local_pred: number; goles_visitante_pred: number } | null;
};

export default function Jugar() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadorId, setJugadorId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("jugadorId");
    setJugadorId(id);
    if (id) fetch(`/api/matches?jugadorId=${id}`).then((r) => r.json()).then((d) => setPartidos(d.partidos));
  }, []);

  async function guardar(partidoId: string, gl: number, gv: number) {
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId, partidoId, golesLocal: gl, golesVisitante: gv }),
    });
  }

  return (
    <main className="mx-auto max-w-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Mis pronósticos</h1>
        <Link className="text-blue-600 underline" href="/ranking">Ver ranking</Link>
      </div>
      {partidos.map((p) => (
        <div key={p.id} className="border rounded p-3 flex items-center gap-2">
          <span className="flex-1 text-right">{p.equipo_local}</span>
          <input type="number" min={0} className="w-12 border rounded p-1 text-center"
            disabled={p.cerrado}
            defaultValue={p.miPronostico?.goles_local_pred ?? ""}
            onBlur={(e) => guardar(p.id, Number(e.target.value), p.miPronostico?.goles_visitante_pred ?? 0)} />
          <span>-</span>
          <input type="number" min={0} className="w-12 border rounded p-1 text-center"
            disabled={p.cerrado}
            defaultValue={p.miPronostico?.goles_visitante_pred ?? ""}
            onBlur={(e) => guardar(p.id, p.miPronostico?.goles_local_pred ?? 0, Number(e.target.value))} />
          <span className="flex-1">{p.equipo_visitante}</span>
          {p.cerrado && <span className="text-xs text-gray-500">cerrado</span>}
        </div>
      ))}
    </main>
  );
}
```

Nota: para edición simultánea de ambos marcadores antes de guardar, el engineer puede mantener estado local por partido; esta versión guarda al salir de cada campo (onBlur) usando el valor previo del otro campo. Es suficiente para el alcance.

- [ ] **Step 3: Pantalla de ranking**

Create `src/app/ranking/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Fila = { nombre: string; puntos: number; exactos: number };

export default function Ranking() {
  const [ranking, setRanking] = useState<Fila[]>([]);
  useEffect(() => {
    fetch("/api/ranking").then((r) => r.json()).then((d) => setRanking(d.ranking));
  }, []);
  return (
    <main className="mx-auto max-w-md p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Ranking</h1>
        <Link className="text-blue-600 underline" href="/jugar">Volver</Link>
      </div>
      <ol className="space-y-1">
        {ranking.map((f, i) => (
          <li key={f.nombre} className="flex justify-between border-b py-1">
            <span>{i + 1}. {f.nombre}</span>
            <span className="font-semibold">{f.puntos} pts <span className="text-xs text-gray-500">({f.exactos} exactos)</span></span>
          </li>
        ))}
      </ol>
    </main>
  );
}
```

- [ ] **Step 4: Panel de administración oculto**

Create `src/app/admin/page.tsx`:
```tsx
"use client";
import { useState } from "react";

export default function Admin() {
  const [clave, setClave] = useState("");
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ equipoLocal: "", equipoVisitante: "", fechaHora: "", fase: "grupos", jornada: 1 });
  const [resultado, setResultado] = useState({ partidoId: "", golesLocal: 0, golesVisitante: 0 });
  const [msg, setMsg] = useState("");

  async function login() {
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    setAuth(res.ok);
    setMsg(res.ok ? "" : "Clave incorrecta");
  }

  async function crearPartido() {
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify({ ...form, jornada: Number(form.jornada) }),
    });
    setMsg(res.ok ? "Partido creado" : "Error al crear");
  }

  async function cargarResultado() {
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify({
        partidoId: resultado.partidoId,
        golesLocal: Number(resultado.golesLocal),
        golesVisitante: Number(resultado.golesVisitante),
      }),
    });
    setMsg(res.ok ? "Resultado cargado y puntos recalculados" : "Error");
  }

  if (!auth) {
    return (
      <main className="mx-auto max-w-sm p-6 space-y-3">
        <h1 className="text-xl font-bold">Admin</h1>
        <input type="password" className="w-full border rounded p-2" placeholder="Clave admin"
          value={clave} onChange={(e) => setClave(e.target.value)} />
        <button className="w-full bg-gray-800 text-white rounded p-2" onClick={login}>Entrar</button>
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6 space-y-6">
      <h1 className="text-xl font-bold">Panel de administración</h1>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Crear partido</h2>
        <input className="w-full border rounded p-2" placeholder="Equipo local"
          onChange={(e) => setForm({ ...form, equipoLocal: e.target.value })} />
        <input className="w-full border rounded p-2" placeholder="Equipo visitante"
          onChange={(e) => setForm({ ...form, equipoVisitante: e.target.value })} />
        <input type="datetime-local" className="w-full border rounded p-2"
          onChange={(e) => setForm({ ...form, fechaHora: e.target.value })} />
        <select className="w-full border rounded p-2" value={form.fase}
          onChange={(e) => setForm({ ...form, fase: e.target.value })}>
          <option value="grupos">Grupos</option>
          <option value="octavos">Octavos</option>
          <option value="cuartos">Cuartos</option>
          <option value="semis">Semis</option>
          <option value="tercer_puesto">Tercer puesto</option>
          <option value="final">Final</option>
        </select>
        <input type="number" className="w-full border rounded p-2" placeholder="Jornada" value={form.jornada}
          onChange={(e) => setForm({ ...form, jornada: Number(e.target.value) })} />
        <button className="w-full bg-blue-600 text-white rounded p-2" onClick={crearPartido}>Crear</button>
      </section>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Cargar resultado</h2>
        <input className="w-full border rounded p-2" placeholder="ID del partido"
          onChange={(e) => setResultado({ ...resultado, partidoId: e.target.value })} />
        <div className="flex gap-2">
          <input type="number" className="w-full border rounded p-2" placeholder="Goles local"
            onChange={(e) => setResultado({ ...resultado, golesLocal: Number(e.target.value) })} />
          <input type="number" className="w-full border rounded p-2" placeholder="Goles visitante"
            onChange={(e) => setResultado({ ...resultado, golesVisitante: Number(e.target.value) })} />
        </div>
        <button className="w-full bg-green-600 text-white rounded p-2" onClick={cargarResultado}>Cargar resultado</button>
      </section>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
```

- [ ] **Step 5: Verificar build de todo el frontend**

Run: `npm run build`
Expected: build exitoso de todas las páginas y rutas.

- [ ] **Step 6: Commit**

```bash
git add src/app
git commit -m "feat: frontend de login, pronósticos, ranking y panel admin"
```

---

## Task 11: README de despliegue y seed de la sala

**Files:**
- Create: `README.md`, `scripts/seed-sala.mjs`

- [ ] **Step 1: Script para generar el hash de la clave admin y crear la sala**

Create `scripts/seed-sala.mjs`:
```js
// Uso: node scripts/seed-sala.mjs <codigo_acceso> <clave_admin>
// Imprime el SQL INSERT para pegar en Supabase con el hash ya calculado.
import bcrypt from "bcryptjs";

const [codigo, clave] = process.argv.slice(2);
if (!codigo || !clave) {
  console.error("Uso: node scripts/seed-sala.mjs <codigo_acceso> <clave_admin>");
  process.exit(1);
}
const hash = bcrypt.hashSync(clave, 10);
console.log(
  `insert into sala (codigo_acceso, clave_admin_hash) values ('${codigo}', '${hash}');`
);
```

- [ ] **Step 2: Escribir el README**

Create `README.md`:
```markdown
# Quiniela Mundial 2026

Web gratuita para una quiniela privada del Mundial 2026. Stack: Next.js + Supabase, desplegable en Vercel.

## Puesta en marcha

### 1. Supabase
1. Crear proyecto gratuito en https://supabase.com
2. SQL Editor → ejecutar `supabase/schema.sql`
3. Generar la sala: `node scripts/seed-sala.mjs MI_CODIGO MI_CLAVE_ADMIN` y ejecutar el INSERT resultante en el SQL Editor.
4. Copiar la URL del proyecto y la **service_role key** (Settings → API).

### 2. Variables de entorno
Copiar `.env.example` a `.env.local` y rellenar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Local
```
npm install
npm run dev
```

### 4. Despliegue en Vercel
1. Importar el repo en https://vercel.com
2. Añadir las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy.

## Uso
- **Jugadores:** entran en `/` con código de sala + nombre + PIN, pronostican en `/jugar`, ven el ranking en `/ranking`.
- **Admin:** entra en `/admin` con la clave secreta para crear partidos y cargar resultados.

## Reglas
- Marcador exacto = 2 pts · resultado (1X2) acertado = 1 pt · fallo = 0.
- Los pronósticos de una jornada se cierran al inicio del primer partido de esa jornada.
```

- [ ] **Step 3: Verificar todos los tests**

Run: `npm test`
Expected: PASS (scoring + locking + ranking).

- [ ] **Step 4: Commit**

```bash
git add README.md scripts/seed-sala.mjs
git commit -m "docs: README de despliegue y script de seed de sala"
```

---

## Notas de seguridad y alcance

- La `SUPABASE_SERVICE_ROLE_KEY` solo se usa en API routes (server). Nunca se expone al cliente.
- El control de acceso del jugador es liviano (nombre + PIN) por diseño: grupo privado, sin datos sensibles.
- El admin se valida revalidando la clave (hash) en cada request admin vía header `x-admin-clave`.
- Fuera de alcance (confirmado en el spec): pagos, eliminatorias previas, pronósticos especiales, múltiples salas, auth con email/Google, carga automática de resultados.
