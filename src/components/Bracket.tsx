"use client";
import { DIECISEISAVOS, RONDAS_SIGUIENTES, LlaveBase } from "@/lib/bracket";
import { Bandera } from "./Bandera";
import { FechaHoraLocal } from "./FechaHoraLocal";
import { PartidoUI } from "./TarjetaPartido";

/* ─── helpers ─── */

function labelLlave(raw: string): string {
  if (/^W\d+$/.test(raw)) return `Gan. ${raw.slice(1)}`;
  if (/^RU\d+$/.test(raw)) return `Per. ${raw.slice(2)}`;
  if (/^\d[A-Z]$/.test(raw)) return raw;          // e.g. "1A", "2B"
  if (/^3[A-Z]+$/.test(raw)) return `3° ${raw.slice(1)}`; // e.g. "3CEFHI"
  return raw;
}

function faseLabel(fase: string): string {
  const MAP: Record<string, string> = {
    dieciseisavos: "1/16",
    octavos: "Octavos",
    cuartos: "Cuartos",
    semis: "Semis",
    tercer_puesto: "3er Puesto",
    final: "Final",
  };
  return MAP[fase] ?? fase;
}

/* ─── sub-components ─── */

function SlotEquipo({
  nombre,
  goles,
  isWinner,
}: {
  nombre: string;
  goles: number | null | undefined;
  isWinner?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 ${
        isWinner ? "bg-violet-50" : ""
      }`}
    >
      <Bandera equipo={nombre} size={16} />
      <span
        className={`flex-1 truncate text-[11px] font-medium leading-none ${
          isWinner ? "text-violet-700 font-bold" : "text-slate-700"
        }`}
      >
        {nombre}
      </span>
      {goles != null && (
        <span
          className={`ml-auto tabular-nums text-[11px] font-bold ${
            isWinner ? "text-violet-700" : "text-slate-500"
          }`}
        >
          {goles}
        </span>
      )}
    </div>
  );
}

function SlotPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-400 shrink-0">
        ?
      </span>
      <span className="flex-1 truncate text-[11px] font-medium text-slate-400 italic leading-none">
        {label}
      </span>
    </div>
  );
}

/** A single bracket match card */
function BracketCard({
  slot,
  partido,
  valor,
  onChange,
  onGuardar,
}: {
  slot: LlaveBase;
  partido: PartidoUI | undefined;
  valor?: { local: string; visitante: string };
  onChange?: (campo: "local" | "visitante", v: string) => void;
  onGuardar?: () => void;
}) {
  if (!partido) {
    // Placeholder — slot not yet resolved
    return (
      <div className="w-[160px] shrink-0 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 overflow-hidden">
        <SlotPlaceholder label={labelLlave(slot.local)} />
        <div className="h-px bg-slate-100" />
        <SlotPlaceholder label={labelLlave(slot.visitante)} />
      </div>
    );
  }

  const jugado =
    partido.goles_local_real != null && partido.goles_visitante_real != null;
  const localWins =
    jugado &&
    (partido.ganador
      ? partido.ganador === partido.equipo_local
      : (partido.goles_local_real ?? 0) > (partido.goles_visitante_real ?? 0));
  const visitanteWins =
    jugado &&
    (partido.ganador
      ? partido.ganador === partido.equipo_visitante
      : (partido.goles_visitante_real ?? 0) > (partido.goles_local_real ?? 0));

  return (
    <div className="w-[160px] shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Date header */}
      <div className="px-2 py-1 bg-slate-50 border-b border-slate-100">
        <p className="text-[9px] font-medium text-slate-400 truncate tabular-nums">
          <FechaHoraLocal iso={partido.fecha_hora} />
        </p>
      </div>

      {/* Local */}
      {jugado ? (
        <SlotEquipo
          nombre={partido.equipo_local}
          goles={partido.goles_local_real}
          isWinner={localWins}
        />
      ) : (
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Bandera equipo={partido.equipo_local} size={14} />
          <span className="flex-1 truncate text-[10px] font-medium text-slate-700 leading-none">
            {partido.equipo_local}
          </span>
          {!partido.cerrado && valor && onChange && onGuardar ? (
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="w-8 rounded-md border border-slate-200 p-0.5 text-center text-[11px] font-bold tabular-nums text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
              value={valor.local}
              onChange={(e) => onChange("local", e.target.value)}
              onBlur={onGuardar}
            />
          ) : (
            <span className="text-[11px] tabular-nums text-slate-300 font-bold">
              {valor?.local !== "" ? valor?.local : "-"}
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-slate-100 mx-2" />

      {/* Visitante */}
      {jugado ? (
        <SlotEquipo
          nombre={partido.equipo_visitante}
          goles={partido.goles_visitante_real}
          isWinner={visitanteWins}
        />
      ) : (
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Bandera equipo={partido.equipo_visitante} size={14} />
          <span className="flex-1 truncate text-[10px] font-medium text-slate-700 leading-none">
            {partido.equipo_visitante}
          </span>
          {!partido.cerrado && valor && onChange && onGuardar ? (
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="w-8 rounded-md border border-slate-200 p-0.5 text-center text-[11px] font-bold tabular-nums text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
              value={valor.visitante}
              onChange={(e) => onChange("visitante", e.target.value)}
              onBlur={onGuardar}
            />
          ) : (
            <span className="text-[11px] tabular-nums text-slate-300 font-bold">
              {valor?.visitante !== "" ? valor?.visitante : "-"}
            </span>
          )}
        </div>
      )}

      {/* My prediction result */}
      {jugado && partido.miPronostico && (
        <div className="px-2 py-1 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[9px] text-slate-400 tabular-nums">
            {partido.miPronostico.goles_local_pred}-
            {partido.miPronostico.goles_visitante_pred}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
              partido.miPronostico.puntos_obtenidos === 2
                ? "bg-green-100 text-green-700"
                : partido.miPronostico.puntos_obtenidos === 1
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            +{partido.miPronostico.puntos_obtenidos}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Column ─── */
function BracketColumn({
  title,
  slots,
  partidos,
  valores,
  onChange,
  onGuardar,
}: {
  title: string;
  slots: LlaveBase[];
  partidos: PartidoUI[];
  valores: Record<string, { local: string; visitante: string }>;
  onChange: (id: string, campo: "local" | "visitante", v: string) => void;
  onGuardar: (id: string) => void;
}) {
  return (
    <div className="flex flex-col shrink-0">
      {/* Column header */}
      <div className="mb-3 text-center">
        <span className="inline-block rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-3 py-1 text-[11px] font-bold text-white tracking-wide uppercase shadow-sm">
          {title}
        </span>
      </div>

      {/* Cards with vertical centering */}
      <div className="flex flex-1 flex-col justify-around gap-3">
        {slots.map((slot) => {
          const partido = partidos.find((p) => p.jornada === slot.codigo);
          return (
            <BracketCard
              key={slot.codigo}
              slot={slot}
              partido={partido}
              valor={partido ? valores[partido.id] : undefined}
              onChange={partido ? (c, v) => onChange(partido.id, c, v) : undefined}
              onGuardar={partido ? () => onGuardar(partido.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Bracket component ─── */
export function Bracket({
  partidos,
  valores,
  onChange,
  onGuardar,
}: {
  partidos: PartidoUI[];
  valores: Record<string, { local: string; visitante: string }>;
  onChange: (id: string, campo: "local" | "visitante", v: string) => void;
  onGuardar: (id: string) => void;
}) {
  // Build phase → slots map
  const octavos = RONDAS_SIGUIENTES.filter((s) => s.fase === "octavos");
  const cuartos = RONDAS_SIGUIENTES.filter((s) => s.fase === "cuartos");
  const semis = RONDAS_SIGUIENTES.filter((s) => s.fase === "semis");
  const tercerPuesto = RONDAS_SIGUIENTES.filter((s) => s.fase === "tercer_puesto");
  const final_ = RONDAS_SIGUIENTES.filter((s) => s.fase === "final");

  const columns: { title: string; slots: LlaveBase[] }[] = [
    { title: faseLabel("dieciseisavos"), slots: DIECISEISAVOS },
    { title: faseLabel("octavos"), slots: octavos },
    { title: faseLabel("cuartos"), slots: cuartos },
    { title: faseLabel("semis"), slots: semis },
    { title: faseLabel("final"), slots: final_ },
    { title: faseLabel("tercer_puesto"), slots: tercerPuesto },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Bracket Eliminatorias
          </span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Desplaza horizontalmente para ver todas las rondas
        </p>
      </div>

      {/* Scrollable bracket area */}
      <div className="overflow-x-auto pb-4 px-4 pt-4">
        <div className="flex gap-6 min-w-max">
          {columns.map(({ title, slots }) => (
            <BracketColumn
              key={title}
              title={title}
              slots={slots}
              partidos={partidos}
              valores={valores}
              onChange={onChange}
              onGuardar={onGuardar}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
