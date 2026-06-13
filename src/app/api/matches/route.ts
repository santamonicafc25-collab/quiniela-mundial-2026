import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jornadaCerrada, gruposBloqueados, PartidoFecha } from "@/lib/locking";

export async function GET(req: NextRequest) {
  const jugadorId = req.nextUrl.searchParams.get("jugadorId");
  if (!jugadorId) return NextResponse.json({ error: "Falta jugadorId" }, { status: 400 });

  const [{ data: partidos }, { data: pronos }, { data: jugador }] = await Promise.all([
    supabase.from("partido").select("*").order("fecha_hora", { ascending: true }),
    supabase.from("pronostico")
      .select("partido_id, goles_local_pred, goles_visitante_pred, puntos_obtenidos")
      .eq("jugador_id", jugadorId),
    supabase.from("jugador").select("sala_id").eq("id", jugadorId).single(),
  ]);

  let graciaAbierta = false;
  if (jugador) {
    const { data: sala } = await supabase
      .from("sala")
      .select("gracia_abierta")
      .eq("id", jugador.sala_id)
      .single();
    graciaAbierta = sala?.gracia_abierta ?? false;
  }

  const fechas: PartidoFecha[] = (partidos ?? []).map((p) => ({
    jornada: p.jornada,
    fechaHora: p.fecha_hora,
  }));

  const ahora = new Date();
  const pronoMap = new Map((pronos ?? []).map((x) => [x.partido_id, x]));

  const enriquecidos = (partidos ?? []).map((p) => {
    const miPronostico = pronoMap.get(p.id) ?? null;
    const cerradoNormal =
      p.estado !== "abierto" ||
      jornadaCerrada(p.jornada, fechas, ahora) ||
      gruposBloqueados(p.fase, ahora);
    // Durante período de gracia: abierto si no tiene pronóstico, cerrado si ya lo tiene.
    const cerrado = graciaAbierta ? miPronostico !== null : cerradoNormal;
    return { ...p, cerrado, miPronostico };
  });

  return NextResponse.json({ partidos: enriquecidos, graciaAbierta });
}
