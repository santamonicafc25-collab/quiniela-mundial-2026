"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Partido = {
  id: string; equipo_local: string; equipo_visitante: string;
  fecha_hora: string; fase: string; jornada: number; cerrado: boolean;
  miPronostico: { goles_local_pred: number; goles_visitante_pred: number } | null;
};

type Marcador = { local: string; visitante: string };

export default function Jugar() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [marcadores, setMarcadores] = useState<Record<string, Marcador>>({});

  useEffect(() => {
    const id = localStorage.getItem("jugadorId");
    setJugadorId(id);
    if (id)
      fetch(`/api/matches?jugadorId=${id}`)
        .then((r) => r.json())
        .then((d: { partidos: Partido[] }) => {
          setPartidos(d.partidos);
          const init: Record<string, Marcador> = {};
          for (const p of d.partidos) {
            init[p.id] = {
              local: p.miPronostico ? String(p.miPronostico.goles_local_pred) : "",
              visitante: p.miPronostico ? String(p.miPronostico.goles_visitante_pred) : "",
            };
          }
          setMarcadores(init);
        });
  }, []);

  function actualizar(partidoId: string, campo: keyof Marcador, valor: string) {
    setMarcadores((m) => ({ ...m, [partidoId]: { ...m[partidoId], [campo]: valor } }));
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

  return (
    <main className="mx-auto max-w-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Mis pronósticos</h1>
        <Link className="text-blue-600 underline" href="/ranking">Ver ranking</Link>
      </div>
      {partidos.map((p) => (
        <div key={p.id} className="border rounded p-3 flex items-center gap-2">
          <span className="flex-1 text-right">{p.equipo_local}</span>
          <input type="number" min={0} className="w-12 border rounded p-1 text-center"
            disabled={p.cerrado}
            value={marcadores[p.id]?.local ?? ""}
            onChange={(e) => actualizar(p.id, "local", e.target.value)}
            onBlur={() => guardar(p.id)} />
          <span>-</span>
          <input type="number" min={0} className="w-12 border rounded p-1 text-center"
            disabled={p.cerrado}
            value={marcadores[p.id]?.visitante ?? ""}
            onChange={(e) => actualizar(p.id, "visitante", e.target.value)}
            onBlur={() => guardar(p.id)} />
          <span className="flex-1">{p.equipo_visitante}</span>
          {p.cerrado && <span className="text-xs text-gray-500">cerrado</span>}
        </div>
      ))}
    </main>
  );
}
