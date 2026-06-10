import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../_auth";

// Auditoría: devuelve, por participante, todos los pronósticos que cargó (solo lectura).
export async function GET(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: jugadores } = await supabase
    .from("jugador")
    .select("id, nombre, fecha_registro")
    .order("nombre", { ascending: true });

  const { data: partidos } = await supabase
    .from("partido")
    .select("id, equipo_local, equipo_visitante, fase, jornada, fecha_hora");

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("jugador_id, partido_id, goles_local_pred, goles_visitante_pred, puntos_obtenidos");

  const partidoById = new Map((partidos ?? []).map((p) => [p.id, p]));

  const resultado = (jugadores ?? []).map((j) => {
    const suyos = (pronos ?? [])
      .filter((pr) => pr.jugador_id === j.id)
      .map((pr) => {
        const m = partidoById.get(pr.partido_id);
        return {
          partidoId: pr.partido_id,
          equipoLocal: m?.equipo_local ?? "?",
          equipoVisitante: m?.equipo_visitante ?? "?",
          fase: m?.fase ?? "?",
          jornada: m?.jornada ?? 0,
          fechaHora: m?.fecha_hora ?? null,
          golesLocal: pr.goles_local_pred,
          golesVisitante: pr.goles_visitante_pred,
          puntos: pr.puntos_obtenidos,
        };
      })
      .sort((a, b) => a.jornada - b.jornada);
    return {
      id: j.id,
      nombre: j.nombre,
      fechaRegistro: j.fecha_registro,
      total: suyos.length,
      pronosticos: suyos,
    };
  });

  return NextResponse.json({ jugadores: resultado });
}
