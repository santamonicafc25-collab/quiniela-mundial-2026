-- Limpieza de partidos de eliminatorias duplicados.
-- Causa: publicar una ronda varias veces cuando el POST solo insertaba (ya corregido a upsert).
-- Cada partido de eliminatorias tiene un `codigo` oficial unico (73..104); los de grupos
-- tienen codigo NULL y NO deben tocarse (por eso filtramos `codigo is not null`).
--
-- Estrategia: por cada `codigo`, conservar la fila con MAS pronosticos (empate -> id menor)
-- y eliminar las demas, borrando primero sus pronosticos para no violar la FK.

-- ─────────────────────────────────────────────────────────────
-- 1) DIAGNOSTICO: ver los duplicados antes de tocar nada
-- ─────────────────────────────────────────────────────────────
select codigo, fase, count(*) as filas, array_agg(id order by id) as ids
from partido
where codigo is not null
group by codigo, fase
having count(*) > 1
order by codigo;

-- ─────────────────────────────────────────────────────────────
-- 2) LIMPIEZA (ejecutar como bloque; usa transaccion)
-- ─────────────────────────────────────────────────────────────
begin;

-- 2a) Borrar los pronosticos de las filas duplicadas que se eliminaran.
with ranked as (
  select p.id,
         row_number() over (
           partition by p.codigo
           order by (select count(*) from pronostico pr where pr.partido_id = p.id) desc,
                    p.id asc
         ) as rn
  from partido p
  where p.codigo is not null
)
delete from pronostico
where partido_id in (select id from ranked where rn > 1);

-- 2b) Borrar las filas de partido duplicadas (conserva rn = 1 por codigo).
with ranked as (
  select p.id,
         row_number() over (
           partition by p.codigo
           order by (select count(*) from pronostico pr where pr.partido_id = p.id) desc,
                    p.id asc
         ) as rn
  from partido p
  where p.codigo is not null
)
delete from partido
where id in (select id from ranked where rn > 1);

commit;

-- ─────────────────────────────────────────────────────────────
-- 3) VERIFICACION: debe devolver 0 filas
-- ─────────────────────────────────────────────────────────────
select codigo, count(*)
from partido
where codigo is not null
group by codigo
having count(*) > 1;

-- ─────────────────────────────────────────────────────────────
-- 4) BLINDAJE (opcional, recomendado): evita duplicados a futuro.
--    Los partidos de grupos (codigo NULL) siguen permitidos porque
--    Postgres trata los NULL como distintos en un UNIQUE.
--    Ejecutar SOLO despues de que el paso 3 devuelva 0 filas.
-- ─────────────────────────────────────────────────────────────
alter table partido
  add constraint partido_sala_codigo_uniq unique (sala_id, codigo);
