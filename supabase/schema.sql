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
