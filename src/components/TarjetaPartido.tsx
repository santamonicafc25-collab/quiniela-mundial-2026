"use client";
import { Bandera } from "./Bandera";
import { FechaHoraLocal } from "./FechaHoraLocal";

export type PartidoUI = {
  id: string; equipo_local: string; equipo_visitante: string;
  fecha_hora: string; fase: string; jornada: number; cerrado: boolean;
  goles_local_real: number | null; goles_visitante_real: number | null;
  ganador: string | null;
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
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-1 text-center text-[11px] font-medium text-slate-400">
        <FechaHoraLocal iso={p.fecha_hora} />{p.cerrado && !jugado && " · cerrado"}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center justify-end gap-2 text-right text-sm font-medium text-slate-800">
          <span className="truncate">{p.equipo_local}</span><Bandera equipo={p.equipo_local} />
        </div>
        {jugado ? (
          <div className="flex items-center gap-1 tabular-nums font-bold text-slate-800 text-base min-w-[3rem] justify-center">
            <span>{p.goles_local_real}</span><span className="text-slate-400">-</span><span>{p.goles_visitante_real}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} inputMode="numeric" disabled={p.cerrado}
              className="w-10 rounded-lg border border-slate-200 bg-white p-1 text-center text-sm font-bold tabular-nums text-slate-800 shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              value={valor.local} onChange={(e) => onChange("local", e.target.value)} onBlur={onGuardar}
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="number" min={0} inputMode="numeric" disabled={p.cerrado}
              className="w-10 rounded-lg border border-slate-200 bg-white p-1 text-center text-sm font-bold tabular-nums text-slate-800 shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              value={valor.visitante} onChange={(e) => onChange("visitante", e.target.value)} onBlur={onGuardar}
            />
          </div>
        )}
        <div className="flex flex-1 items-center gap-2 text-sm font-medium text-slate-800">
          <Bandera equipo={p.equipo_visitante} /><span className="truncate">{p.equipo_visitante}</span>
        </div>
      </div>
      {jugado && p.miPronostico && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Tu pronóstico: <span className="tabular-nums font-semibold">{p.miPronostico.goles_local_pred}-{p.miPronostico.goles_visitante_pred}</span></span>
          <span className={
            "rounded-full px-2 py-0.5 font-semibold tabular-nums " +
            (p.miPronostico.puntos_obtenidos === 2 ? "bg-green-100 text-green-700"
              : p.miPronostico.puntos_obtenidos === 1 ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-500")
          }>+{p.miPronostico.puntos_obtenidos}</span>
        </div>
      )}
    </div>
  );
}
