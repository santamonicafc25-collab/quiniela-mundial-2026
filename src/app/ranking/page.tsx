"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Fila = { nombre: string; puntos: number; exactos: number };

export default function Ranking() {
  const [ranking, setRanking] = useState<Fila[]>([]);
  useEffect(() => {
    fetch("/api/ranking").then((r) => r.json()).then((d) => setRanking(d.ranking));
  }, []);
  return (
    <main className="mx-auto max-w-md p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Ranking</h1>
        <Link className="text-blue-600 underline" href="/jugar">Volver</Link>
      </div>
      <ol className="space-y-1">
        {ranking.map((f, i) => (
          <li key={f.nombre} className="flex justify-between border-b py-1">
            <span>{i + 1}. {f.nombre}</span>
            <span className="font-semibold">{f.puntos} pts <span className="text-xs text-gray-500">({f.exactos} exactos)</span></span>
          </li>
        ))}
      </ol>
    </main>
  );
}
