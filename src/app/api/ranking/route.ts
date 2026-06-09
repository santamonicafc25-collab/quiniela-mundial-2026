import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ordenarRanking, FilaRanking } from "@/lib/ranking";

export async function GET() {
  const { data: jugadores } = await supabase
    .from("jugador")
    .select("id, nombre, fecha_registro")
    .order("fecha_registro", { ascending: true });

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("jugador_id, puntos_obtenidos");

  const filas: FilaRanking[] = (jugadores ?? []).map((j, idx) => {
    const suyos = (pronos ?? []).filter((p) => p.jugador_id === j.id);
    return {
      nombre: j.nombre,
      puntos: suyos.reduce((s, p) => s + p.puntos_obtenidos, 0),
      exactos: suyos.filter((p) => p.puntos_obtenidos === 2).length,
      registro: idx,
    };
  });

  return NextResponse.json({ ranking: ordenarRanking(filas) });
}
