import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jornadaCerrada, PartidoFecha } from "@/lib/locking";

export async function GET(req: NextRequest) {
  const jugadorId = req.nextUrl.searchParams.get("jugadorId");
  if (!jugadorId) return NextResponse.json({ error: "Falta jugadorId" }, { status: 400 });

  const { data: partidos } = await supabase
    .from("partido")
    .select("*")
    .order("fecha_hora", { ascending: true });

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("partido_id, goles_local_pred, goles_visitante_pred, puntos_obtenidos")
    .eq("jugador_id", jugadorId);

  const fechas: PartidoFecha[] = (partidos ?? []).map((p) => ({
    jornada: p.jornada,
    fechaHora: p.fecha_hora,
  }));

  const ahora = new Date();
  const enriquecidos = (partidos ?? []).map((p) => ({
    ...p,
    cerrado: p.estado !== "abierto" || jornadaCerrada(p.jornada, fechas, ahora),
    miPronostico: (pronos ?? []).find((x) => x.partido_id === p.id) ?? null,
  }));

  return NextResponse.json({ partidos: enriquecidos });
}
