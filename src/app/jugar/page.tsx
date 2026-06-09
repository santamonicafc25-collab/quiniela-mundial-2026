"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Partido = {
  id: string; equipo_local: string; equipo_visitante: string;
  fecha_hora: string; fase: string; jornada: number; cerrado: boolean;
  miPronostico: { goles_local_pred: number; goles_visitante_pred: number } | null;
};

export default function Jugar() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadorId, setJugadorId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("jugadorId");
    setJugadorId(id);
    if (id) fetch(`/api/matches?jugadorId=${id}`).then((r) => r.json()).then((d) => setPartidos(d.partidos));
  }, []);

  async function guardar(partidoId: string, gl: number, gv: number) {
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId, partidoId, golesLocal: gl, golesVisitante: gv }),
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
            defaultValue={p.miPronostico?.goles_local_pred ?? ""}
            onBlur={(e) => guardar(p.id, Number(e.target.value), p.miPronostico?.goles_visitante_pred ?? 0)} />
          <span>-</span>
          <input type="number" min={0} className="w-12 border rounded p-1 text-center"
            disabled={p.cerrado}
            defaultValue={p.miPronostico?.goles_visitante_pred ?? ""}
            onBlur={(e) => guardar(p.id, p.miPronostico?.goles_local_pred ?? 0, Number(e.target.value))} />
          <span className="flex-1">{p.equipo_visitante}</span>
          {p.cerrado && <span className="text-xs text-gray-500">cerrado</span>}
        </div>
      ))}
    </main>
  );
}
