# Rediseño UI Quiniela Mundial 2026 — Documento de Diseño

**Fecha:** 2026-06-10
**Estado:** Aprobado por el usuario

## Objetivo

Rediseñar por completo la interfaz (jugador y admin) de la quiniela ya en producción, con estética "Vistosa Mundial", banderas, fechas/horas, tabla de posiciones por grupo, y generación automática (con confirmación del admin) de las fases eliminatorias. Mantener intacta la lógica de negocio existente (puntuación 2/1/0, cierre por partido, acceso nombre+PIN, una sola sala). Desplegar a producción.

## Contexto / estado actual

- App Next.js 15 (App Router, TS, Tailwind v4) + Supabase, en producción (Vercel, auto-deploy desde `master`).
- Tablas: `sala`, `jugador`, `partido` (con `fase_t` = grupos/octavos/cuartos/semis/tercer_puesto/final, `estado_t` = abierto/cerrado/finalizado), `pronostico`.
- 72 partidos de grupos cargados. Cierre por partido = cada partido tiene `jornada` único (grupos 1–72).
- Puntuación: marcador exacto = 2, resultado (1X2) = 1, fallo = 0 (`src/lib/scoring.ts`, testeado).
- Páginas actuales (`page.tsx` login, `jugar`, `ranking`, `admin`) son funcionales pero planas → se reescriben.

## 1. App del jugador

Estilo "Vistoso Mundial": mobile-first, header con degradado, tarjetas, banderas grandes, acentos de color. Tras login, navegación por pestañas **Grupos · Eliminatorias · Ranking**. Header muestra título, nombre del jugador y botón salir.

### 1.1 Pestaña Grupos
- 12 tarjetas (A–L). Cada tarjeta contiene:
  - **Tabla de posiciones** del grupo, calculada con resultados reales: columnas Equipo (bandera+nombre), PJ, G, E, P, GF, GC, DG, Pts. Ordenada. Los 2 primeros resaltados (zona de clasificación), el 3º con marca suave.
  - Los **6 partidos** del grupo, cada uno:
    - Fecha y hora en la **zona horaria del navegador** del jugador.
    - Banderas + nombres de ambos equipos.
    - Si `abierto` y no cerrado: dos inputs numéricos para el pronóstico (autoguardado al cambiar/blur).
    - Si cerrado/finalizado: el pronóstico del jugador, el resultado real, y un badge de **puntos** (+2 / +1 / 0).

### 1.2 Pestaña Eliminatorias
- Vista de **bracket** (dieciseisavos → octavos → cuartos → semis → final + 3er puesto).
- Antes de generarse: estructura con **placeholders** (1A, 2B, 3CEFHI, W73…), marcados "por definir".
- Tras generarse: equipos reales; cada partido es pronosticable (cierre por partido).

### 1.3 Pestaña Ranking
- **Podio** para el top 3 + tabla completa: posición, nombre, puntos, aciertos exactos.

## 2. Banderas y horas

- **Banderas:** `https://flagcdn.com/<code>.svg` (o PNG `w40`) por código ISO 3166-1 alpha-2. Mapa `equipo → { iso, nombre }` para los 48 equipos. Casos especiales: Inglaterra → `gb-eng`, Escocia → `gb-sct`. Componente `<Bandera equipo=... />` con fallback si no hay código.
- **Horas:** `partido.fecha_hora` está en UTC (timestamptz). Se muestran con `Intl.DateTimeFormat('es', { timeZone: <navegador> })`, formato corto ej. "jue 11 jun · 21:00".

## 3. Lógica de posiciones (nueva, testeada con TDD)

`src/lib/standings.ts`:
- Entrada: lista de partidos de grupos con resultados (los `finalizado`).
- Por grupo: victoria=3, empate=1, derrota=0. Acumula PJ, G, E, P, GF, GC, DG, Pts.
- Orden (desempate): **Pts → DG → GF**. (Los criterios FIFA adicionales —enfrentamiento directo, fair play, sorteo— quedan fuera; se ajustan vía override del admin en la generación de eliminatorias.)
- Devuelve, por grupo, la tabla ordenada; y un ranking global de **terceros** (los 12 terceros ordenados por Pts→DG→GF) para identificar los 8 mejores.
- Función pura, con tests.

## 4. Eliminatorias automáticas con confirmación del admin

### 4.1 Estructura del bracket (fija, en código)
`src/lib/bracket.ts` define los 16 cruces de dieciseisavos y las rondas siguientes según el cuadro oficial FIFA (del PDF):

Dieciseisavos (códigos 73–88), feeders:
- 73: 2A vs 2B
- 74: 1C vs 2F
- 75: 1E vs 3(ABCDF)
- 76: 1F vs 2C
- 77: 2E vs 2I
- 78: 1I vs 3(CDFGH)
- 79: 1A vs 3(CEFHI)
- 80: 1L vs 3(EHIJK)
- 81: 1G vs 3(AEHIJ)
- 82: 1D vs 3(BEFIJ)
- 83: 1H vs 2J
- 84: 2K vs 2L
- 85: 1B vs 3(EFGIJ)
- 86: 2D vs 2G
- 87: 1J vs 2H
- 88: 1K vs 3(DEIJL)

Octavos (89–96): 89:W73-W75, 90:W74-W77, 91:W76-W78, 92:W79-W80, 93:W83-W84, 94:W81-W82, 95:W86-W88, 96:W85-W87. Cuartos (97–100): 97:W89-W90, 98:W93-W94, 99:W91-W92, 100:W95-W96. Semis (101–102): 101:W97-W98, 102:W99-W100. Tercer puesto (RU101 vs RU102). Final (W101 vs W102).
(Las fechas/horas/estadios de cada llave salen del PDF oficial y se fijan al generar cada ronda.)

### 4.2 Asignación de terceros
- Las 8 ranuras de "tercer" en dieciseisavos (3ABCDF, 3CDFGH, 3CEFHI, 3EHIJK, 3AEHIJ, 3BEFIJ, 3EFGIJ, 3DEIJL) se asignan según la **tabla oficial FIFA de mejores terceros** (mapea el conjunto de 8 grupos cuyo tercero clasifica → qué grupo va a cada ranura). Se codifica en `src/lib/bracket.ts`.
- La generación **propone** la asignación automática y el admin la **confirma o ajusta** antes de publicar.

### 4.3 Flujo de generación (admin)
1. Cuando los 72 partidos de grupos están `finalizado`, en el admin aparece **"Generar dieciseisavos"**.
2. El sistema calcula posiciones, determina 1º/2º por grupo y el ranking de terceros; propone los 16 cruces con equipos reales (terceros vía tabla FIFA).
3. El admin ve los 32 clasificados en sus llaves y puede **editar** (especialmente los terceros) antes de **publicar**.
4. Al publicar, se crean 16 filas `partido` fase=`dieciseisavos`, con `codigo` 73–88, `jornada` única (73–88), fecha/hora del PDF, `estado=abierto`.

### 4.4 Avance de rondas
- Cada partido de eliminatoria, al cargar resultado, el admin indica **quién avanza** (`ganador`) — necesario por penales (no hay empate real). Si el marcador no es empate, se pre-selecciona el ganador por marcador.
- Cuando ambos partidos que alimentan una llave siguiente tienen `ganador`, el admin pulsa **"Generar octavos / cuartos / …"** y se crean esas filas con los equipos resueltos, `codigo` y `jornada` únicos correlativos.

## 5. App del admin (tablero vistoso)

- **Tablero de partidos:** todos los `partido` en una tabla con fase/grupo, fecha (local), banderas+equipos, resultado actual; inputs inline para marcador (+ selector "avanza" en eliminatorias) y botón Guardar → `POST /api/admin/result` (recalcula puntos). **Filtros:** por fase/grupo, por fecha, y "solo pendientes" (sin resultado). Buscador por equipo.
- **Generación de eliminatorias:** UI del flujo 4.3/4.4.
- **Ranking:** módulo con la puntuación de todos los jugadores (reutiliza `GET /api/ranking`).

## 6. Cambios técnicos

### 6.1 Base de datos (migración SQL en Supabase)
- `alter type fase_t add value 'dieciseisavos';` (antes de 'octavos' conceptualmente; el orden del enum no afecta la lógica).
- `alter table partido add column ganador text;` (equipo que avanza, solo eliminatorias).
- `alter table partido add column codigo text;` (identificador de llave del bracket, ej. '73').

### 6.2 Backend (API routes)
- **Nuevo** `GET /api/standings` → posiciones por grupo + ranking de terceros (usa `standings.ts`).
- **Extender** `GET /api/matches` → incluir, por partido, el resultado real (ya viene) y los **puntos** del jugador en ese partido.
- **Nuevos admin:** `GET /api/admin/standings` (preview de clasificados), `POST /api/admin/generate-knockout` (crea ronda tras confirmación), y extender `POST /api/admin/result` para aceptar `ganador`.
- Reutiliza login/result/ranking existentes.

### 6.3 Frontend
- Reescritura de `src/app/jugar/page.tsx`, `src/app/ranking/page.tsx`, `src/app/admin/page.tsx`.
- Componentes nuevos reutilizables en `src/components/`: `Bandera`, `TarjetaPartido`, `TablaGrupo`, `Bracket`, `Podio`, `FechaHoraLocal`.
- Datos de equipos (nombre↔ISO) en `src/lib/equipos.ts`.

### 6.4 Despliegue
- Migración SQL aplicada en Supabase (manual, documentada).
- Código a `master` → auto-deploy en Vercel.
- Verificación end-to-end en producción (con datos de prueba que se limpian).

## 7. Fuera de alcance (YAGNI)
- Cambios en el modelo de acceso (sigue nombre+PIN, una sala).
- Pagos.
- Edición de fechas de partidos por el jugador.
- Desempates FIFA exóticos automáticos (se resuelven con el override del admin).
- Notificaciones / emails.

## 8. Riesgos
- **Asignación de terceros:** mitigado con confirmación del admin antes de publicar.
- **flagcdn disponibilidad:** fallback a código de texto si una bandera no carga.
- **Migración de enum:** `add value` es seguro y no rompe datos existentes.
