import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jornadaCerrada, gruposBloqueados, PartidoFecha } from "@/lib/locking";

export async function POST(req: NextRequest) {
  const { jugadorId, partidoId, golesLocal, golesVisitante } = await req.json();
  if (!jugadorId || !partidoId || golesLocal == null || golesVisitante == null) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: partido } = await supabase
    .from("partido")
    .select("jornada, estado, fase")
    .eq("id", partidoId)
    .single();
  if (!partido) return NextResponse.json({ error: "Partido no existe" }, { status: 404 });

  // Cierre global de la fase de grupos (12-jun 00:00 España): nadie modifica grupos tras esa hora.
  if (gruposBloqueados(partido.fase)) {
    return NextResponse.json(
      { error: "Los pronósticos de la fase de grupos están cerrados" },
      { status: 403 }
    );
  }

  const { data: deLaJornada } = await supabase
    .from("partido")
    .select("jornada, fecha_hora")
    .eq("jornada", partido.jornada);
  const fechas: PartidoFecha[] = (deLaJornada ?? []).map((p) => ({
    jornada: p.jornada,
    fechaHora: p.fecha_hora,
  }));

  if (partido.estado !== "abierto" || jornadaCerrada(partido.jornada, fechas)) {
    return NextResponse.json({ error: "La jornada está cerrada" }, { status: 403 });
  }

  const { error } = await supabase
    .from("pronostico")
    .upsert(
      {
        jugador_id: jugadorId,
        partido_id: partidoId,
        goles_local_pred: golesLocal,
        goles_visitante_pred: golesVisitante,
      },
      { onConflict: "jugador_id,partido_id" }
    );
  if (error) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
