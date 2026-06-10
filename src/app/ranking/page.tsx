"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Podio } from "@/components/Podio";
import type { FilaRanking } from "@/components/Podio";

export default function Ranking() {
  const [ranking, setRanking] = useState<FilaRanking[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((d) => {
        setRanking(d.ranking ?? []);
        setCargando(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 40%, #0ea5e9 100%)",
        }}
      >
        <div className="mx-auto max-w-md px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                🏆 Ranking
              </h1>
              <p className="text-xs font-medium text-indigo-200 mt-0.5 uppercase tracking-widest">
                Quiniela Mundial 2026
              </p>
            </div>
            <Link
              href="/jugar"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
            >
              ← Mis pronósticos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 space-y-4">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Cargando ranking…
            </p>
          </div>
        ) : (
          <>
            <Podio top3={ranking.slice(0, 3)} />

            {ranking.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div
                  className="px-5 py-3 border-b border-slate-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)",
                  }}
                >
                  <h2 className="text-xs font-bold tracking-widest text-white uppercase">
                    Clasificación completa
                  </h2>
                </div>

                <div className="divide-y divide-slate-50">
                  {ranking.map((fila, idx) => (
                    <div
                      key={fila.nombre + idx}
                      className={[
                        "flex items-center gap-3 px-5 py-3 transition-colors",
                        idx === 0
                          ? "bg-amber-50/60"
                          : idx === 1
                          ? "bg-slate-50/80"
                          : idx === 2
                          ? "bg-orange-50/50"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-400">
                        {idx < 3
                          ? ["🥇", "🥈", "🥉"][idx]
                          : `${idx + 1}`}
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                        {fila.nombre}
                      </span>
                      <span className="tabular-nums text-sm font-bold text-slate-700">
                        {fila.puntos}
                        <span className="ml-0.5 text-[11px] font-normal text-slate-400">
                          pts
                        </span>
                      </span>
                      {fila.exactos > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-500 tabular-nums">
                          ★{fila.exactos}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ranking.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white py-12 text-center shadow-sm">
                <p className="text-sm text-slate-400 italic">
                  Sin resultados aún
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
