# Quiniela Mundial 2026 — Documento de Diseño

**Fecha:** 2026-06-09
**Estado:** Aprobado por el usuario

## 1. Objetivo

Web responsive y **totalmente gratuita** para organizar una quiniela del **Mundial 2026** entre un grupo privado de amigos/familia. Los participantes pronostican el marcador de los partidos desde la fase de grupos hasta la final y compiten en un ranking. El dinero/premio se gestiona **por fuera** de la aplicación (la web no maneja pagos).

## 2. Reglas de juego

### Alcance de partidos
- **Solo Mundial 2026**: desde la fase de grupos (48 equipos) hasta la final.
- NO incluye las eliminatorias previas por confederación.

### Puntuación
- **Resultado + goles exactos acertados** → **2 puntos**
  (predice el marcador exacto, ej. predijo 2-1 y el resultado fue 2-1).
- **Solo el resultado (1X2) acertado** → **1 punto**
  (acierta ganador/empate pero no el marcador exacto, ej. predijo 2-1 y fue 3-0; ambos son victoria local).
- **Sin acierto** → **0 puntos**.

### Cierre de pronósticos
- Los partidos se agrupan en **jornadas**.
- Los pronósticos de una jornada se **cierran al arrancar el primer partido** de esa jornada (ya no se pueden editar).

### Fase eliminatoria
- Los equipos de cada cruce no se conocen hasta terminar la fase previa.
- El admin **abre el pronóstico de cada cruce** cuando los equipos reales quedan definidos (pronóstico partido a partido, no bracket anticipado).

### Ranking
- Orden por **puntos totales** descendente.
- Desempate por **número de aciertos exactos** (marcadores de 2 puntos).
- Segundo desempate: orden de registro del jugador.

## 3. Arquitectura técnica

- **Frontend:** Next.js (React), desplegado en **Vercel** (capa gratuita). Diseño responsive móvil + escritorio.
- **Backend / Base de datos:** **Supabase** (Postgres, capa gratuita). Toda la lógica de negocio en funciones serverless de Vercel / API routes que hablan con Supabase.
- **Sin servidor propio ni costos recurrentes.**

## 4. Acceso e identidad

- **Una sola quiniela** (una sala, un ranking).
- Los jugadores entran con **código de sala + nombre + PIN personal de 4 dígitos**.
  - El PIN evita que un jugador edite los pronósticos de otro. No se usan emails ni contraseñas complejas.
  - El primer ingreso de un nombre nuevo crea al jugador y fija su PIN; ingresos posteriores con ese nombre requieren el PIN correcto.
- **Administrador:** accede por una **URL/panel separado y oculto**, protegido con una **clave secreta de admin**.

## 5. Modelo de datos (simplificado)

- **sala**: `id`, `codigo_acceso`, `clave_admin_hash`, `nombre`.
- **jugador**: `id`, `sala_id`, `nombre`, `pin_hash`, `fecha_registro`.
- **partido**: `id`, `sala_id`, `equipo_local`, `equipo_visitante`, `fecha_hora`, `fase` (grupos/octavos/cuartos/semis/tercer_puesto/final), `jornada`, `goles_local_real`, `goles_visitante_real`, `estado` (abierto/cerrado/finalizado).
- **pronostico**: `id`, `jugador_id`, `partido_id`, `goles_local_pred`, `goles_visitante_pred`, `puntos_obtenidos`.

## 6. Flujo del jugador

1. Entra a la web e ingresa **código de sala + nombre + PIN**.
2. Ve la lista de partidos **abiertos** y carga su marcador previsto para cada uno.
3. Los pronósticos de una jornada se **cierran al arrancar el primer partido** de esa jornada.
4. Cuando el admin carga el resultado real, los puntos se calculan automáticamente.
5. Consulta el **ranking** actualizado.
6. En eliminatorias, cada cruce se abre a pronóstico cuando se conocen los equipos reales.

## 7. Panel de administrador (oculto)

URL separada protegida con la clave secreta del admin. Permite:
- Crear/editar el **calendario de partidos** y agruparlos por jornada.
- Ingresar el **marcador real** de cada partido → dispara el recálculo de puntos de todos los pronósticos de ese partido.
- **Abrir los cruces** de eliminatorias cuando se definen los equipos.
- Ver y, si hace falta, moderar jugadores.

## 8. Cálculo de puntos (lógica)

Al ingresar el resultado real de un partido:
- Para cada pronóstico de ese partido:
  - Si `goles_local_pred == goles_local_real` Y `goles_visitante_pred == goles_visitante_real` → **2 puntos**.
  - Si no, pero el **signo del resultado** coincide (local gana / empate / visitante gana) → **1 punto**.
  - En caso contrario → **0 puntos**.
- El estado del partido pasa a `finalizado`.

## 9. Fuera de alcance (YAGNI)

- Pagos / gestión de dinero dentro de la app.
- Eliminatorias previas al Mundial.
- Pronósticos especiales (goleador, campeón anticipado, MVP).
- Múltiples salas independientes.
- Autenticación con email/Google.
- Carga automática de resultados vía API externa (el admin los carga a mano).
