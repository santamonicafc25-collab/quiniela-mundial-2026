import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../login/route";
import { puntosPronostico } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { partidoId, golesLocal, golesVisitante } = await req.json();

  await supabase
    .from("partido")
    .update({
      goles_local_real: golesLocal,
      goles_visitante_real: golesVisitante,
      estado: "finalizado",
    })
    .eq("id", partidoId);

  const { data: pronos } = await supabase
    .from("pronostico")
    .select("id, goles_local_pred, goles_visitante_pred")
    .eq("partido_id", partidoId);

  for (const p of pronos ?? []) {
    const pts = puntosPronostico(
      { local: p.goles_local_pred, visitante: p.goles_visitante_pred },
      { local: golesLocal, visitante: golesVisitante }
    );
    await supabase.from("pronostico").update({ puntos_obtenidos: pts }).eq("id", p.id);
  }

  return NextResponse.json({ ok: true, actualizados: (pronos ?? []).length });
}
