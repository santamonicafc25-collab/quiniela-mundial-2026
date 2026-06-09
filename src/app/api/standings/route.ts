import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tablaGrupo, rankingTerceros, PartidoResultado } from "@/lib/standings";
import { GRUPO_DE_EQUIPO } from "@/lib/equipos";

const GRUPOS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export async function GET() {
  const { data: partidos } = await supabase
    .from("partido")
    .select("equipo_local, equipo_visitante, goles_local_real, goles_visitante_real")
    .eq("fase", "grupos")
    .eq("estado", "finalizado");

  const resultados: PartidoResultado[] = (partidos ?? [])
    .filter((p) => p.goles_local_real != null && p.goles_visitante_real != null)
    .map((p) => ({
      grupo: GRUPO_DE_EQUIPO[p.equipo_local] ?? "?",
      local: p.equipo_local, visitante: p.equipo_visitante,
      gl: p.goles_local_real as number, gv: p.goles_visitante_real as number,
    }));

  const tablas = GRUPOS.map((g) => ({ grupo: g, filas: tablaGrupo(g, resultados) }));
  const terceros = rankingTerceros(GRUPOS, resultados);
  return NextResponse.json({ tablas, terceros });
}
