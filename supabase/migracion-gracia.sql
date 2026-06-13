-- Agrega columna gracia_abierta a sala para el período de gracia controlado por admin.
-- El admin puede abrir/cerrar la ventana para que participantes completen pronósticos
-- que no hayan hecho, sin poder modificar los ya existentes.
alter table sala add column if not exists gracia_abierta boolean not null default false;
