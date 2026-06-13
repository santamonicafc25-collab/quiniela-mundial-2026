"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TarjetaPartido, PartidoUI } from "@/components/TarjetaPartido";
import { TablaGrupo, FilaTabla } from "@/components/TablaGrupo";
import { Bracket } from "@/components/Bracket";
import { Podio } from "@/components/Podio";
import { Tabs } from "@/components/Tabs";
import { GRUPO_DE_EQUIPO } from "@/lib/equipos";

type Marcador = { local: string; visitante: string };

type FilaRanking = { nombre: string; puntos: number; exactos: number };

const GRUPOS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
const TABS = ["Grupos", "Eliminatorias", "Ranking"] as const;

export default function Jugar() {
  const router = useRouter();
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [partidos, setPartidos] = useState<PartidoUI[]>([]);
  const [tablas, setTablas] = useState<{ grupo: string; filas: FilaTabla[] }[]>([]);
  const [ranking, setRanking] = useState<FilaRanking[]>([]);
  const [marcadores, setMarcadores] = useState<Record<string, Marcador>>({});
  const [tabActiva, setTabActiva] = useState<string>("Grupos");
  const [cargando, setCargando] = useState(true);
  const [graciaAbierta, setGraciaAbierta] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("jugadorId");
    const nom = localStorage.getItem("nombre") ?? "";
    if (!id) {
      router.push("/");
      return;
    }
    setJugadorId(id);
    setNombre(nom);

    Promise.all([
      fetch(`/api/matches?jugadorId=${id}`).then((r) => r.json()),
      fetch("/api/standings").then((r) => r.json()),
      fetch("/api/ranking").then((r) => r.json()),
    ]).then(([matchData, standData, rankData]) => {
      const ps: PartidoUI[] = matchData.partidos ?? [];
      setPartidos(ps);
      setGraciaAbierta(matchData.graciaAbierta ?? false);

      const init: Record<string, Marcador> = {};
      for (const p of ps) {
        init[p.id] = {
          local: p.miPronostico ? String(p.miPronostico.goles_local_pred) : "",
          visitante: p.miPronostico
            ? String(p.miPronostico.goles_visitante_pred)
            : "",
        };
      }
      setMarcadores(init);

      setTablas(standData.tablas ?? []);
      setRanking(rankData.ranking ?? []);
      setCargando(false);
    });
  }, [router]);

  function actualizar(
    partidoId: string,
    campo: "local" | "visitante",
    valor: string
  ) {
    setMarcadores((m) => ({
      ...m,
      [partidoId]: { ...m[partidoId], [campo]: valor },
    }));
  }

  async function guardar(partidoId: string) {
    const m = marcadores[partidoId];
    if (!jugadorId || !m || m.local === "" || m.visitante === "") return;
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugadorId,
        partidoId,
        golesLocal: Number(m.local),
        golesVisitante: Number(m.visitante),
      }),
    });
  }

  function salir() {
    localStorage.removeItem("jugadorId");
    localStorage.removeItem("nombre");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 40%, #0ea5e9 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight tracking-tight">
                ⚽ Quiniela{" "}
                <span className="text-amber-300">Mundial 2026</span>
              </h1>
              {nombre && (
                <p className="text-xs font-medium text-indigo-200 mt-0.5">
                  Hola, <span className="text-white font-semibold">{nombre}</span>
                </p>
              )}
            </div>
            <button
              onClick={salir}
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-2">
          <Tabs
            tabs={[...TABS]}
            activo={tabActiva}
            onChange={setTabActiva}
          />
        </div>
      </div>

      {/* Banner período de gracia */}
      {graciaAbierta && !cargando && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto max-w-2xl px-4 py-2.5 flex items-start gap-2">
            <span className="text-amber-500 text-base mt-0.5 shrink-0">🔓</span>
            <p className="text-xs text-amber-700 font-medium leading-snug">
              <span className="font-bold">Período de gracia activo:</span> podés completar pronósticos que no hayas ingresado. Los que ya tenés no se pueden cambiar.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-5">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Cargando pronósticos…</p>
          </div>
        ) : (
          <>
            {/* ── GRUPOS ── */}
            {tabActiva === "Grupos" && (
              <div className="space-y-8">
                {GRUPOS.map((g) => {
                  const partidosGrupo = partidos.filter(
                    (p) =>
                      p.fase === "grupos" && GRUPO_DE_EQUIPO[p.equipo_local] === g
                  );
                  const filas =
                    tablas.find((t) => t.grupo === g)?.filas ?? [];

                  return (
                    <section key={g} className="space-y-3">
                      <TablaGrupo grupo={g} filas={filas} />
                      {partidosGrupo.length > 0 && (
                        <div className="space-y-2">
                          {partidosGrupo.map((p) => (
                            <TarjetaPartido
                              key={p.id}
                              p={p}
                              valor={
                                marcadores[p.id] ?? { local: "", visitante: "" }
                              }
                              onChange={(campo, v) =>
                                actualizar(p.id, campo, v)
                              }
                              onGuardar={() => guardar(p.id)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {/* ── ELIMINATORIAS ── */}
            {tabActiva === "Eliminatorias" && (
              <Bracket
                partidos={partidos.filter((p) => p.fase !== "grupos")}
                valores={marcadores}
                onChange={(id, campo, v) => actualizar(id, campo, v)}
                onGuardar={guardar}
              />
            )}

            {/* ── RANKING ── */}
            {tabActiva === "Ranking" && (
              <div className="space-y-4">
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
                          className="flex items-center gap-3 px-5 py-3"
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
