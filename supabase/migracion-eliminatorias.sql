-- Añade el valor 'dieciseisavos' al enum de fases (Round of 32 del Mundial 2026).
alter type fase_t add value if not exists 'dieciseisavos';

-- Columnas para eliminatorias.
alter table partido add column if not exists ganador text;  -- equipo que avanza (penales)
alter table partido add column if not exists codigo int;    -- nº oficial de partido (73..104) para el bracket
