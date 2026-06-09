import { Bandera } from "./Bandera";

export type FilaTabla = {
  grupo: string;
  equipo: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export function TablaGrupo({ grupo, filas }: { grupo: string; filas: FilaTabla[] }) {
  if (filas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500">
          <h3 className="text-sm font-bold tracking-widest text-white uppercase">
            Grupo {grupo}
          </h3>
        </div>
        <p className="py-6 text-center text-sm text-slate-400 italic">
          Sin partidos jugados aún
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500">
        <h3 className="text-sm font-bold tracking-widest text-white uppercase">
          Grupo {grupo}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="w-8 px-3 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                #
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Equipo
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                PJ
              </th>
              {/* Extended stats — hidden on mobile */}
              <th className="hidden sm:table-cell px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                G
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                E
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                P
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                GF
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                GC
              </th>
              {/* DG always visible */}
              <th className="px-2 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                DG
              </th>
              {/* Pts always visible */}
              <th className="px-3 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filas.map((fila, idx) => {
              const clasifica = idx < 2;
              const tercero = idx === 2;
              const rowBg = clasifica
                ? "bg-emerald-50/60 hover:bg-emerald-50"
                : tercero
                ? "bg-amber-50/50 hover:bg-amber-50"
                : "hover:bg-slate-50";

              return (
                <tr key={fila.equipo} className={`transition-colors ${rowBg}`}>
                  {/* Pos */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                        clasifica
                          ? "bg-emerald-500 text-white"
                          : tercero
                          ? "bg-amber-400 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  {/* Equipo */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Bandera equipo={fila.equipo} size={18} />
                      <span className="font-medium text-slate-800 leading-none">
                        {fila.equipo}
                      </span>
                    </div>
                  </td>

                  {/* PJ */}
                  <td className="px-2 py-2.5 text-center tabular-nums font-medium text-slate-600">
                    {fila.pj}
                  </td>

                  {/* G/E/P/GF/GC — sm+ */}
                  <td className="hidden sm:table-cell px-2 py-2.5 text-center tabular-nums text-slate-600">
                    {fila.g}
                  </td>
                  <td className="hidden sm:table-cell px-2 py-2.5 text-center tabular-nums text-slate-600">
                    {fila.e}
                  </td>
                  <td className="hidden sm:table-cell px-2 py-2.5 text-center tabular-nums text-slate-600">
                    {fila.p}
                  </td>
                  <td className="hidden sm:table-cell px-2 py-2.5 text-center tabular-nums text-slate-600">
                    {fila.gf}
                  </td>
                  <td className="hidden sm:table-cell px-2 py-2.5 text-center tabular-nums text-slate-600">
                    {fila.gc}
                  </td>

                  {/* DG */}
                  <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">
                    <span className={fila.dg > 0 ? "text-emerald-600" : fila.dg < 0 ? "text-red-500" : ""}>
                      {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                    </span>
                  </td>

                  {/* Pts */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="tabular-nums font-bold text-slate-800">
                      {fila.pts}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-slate-500">Clasifica</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-[11px] text-slate-500">Posible 3°</span>
        </div>
      </div>
    </div>
  );
}
