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
