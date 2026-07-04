import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../_auth";
import { tablaGrupo, rankingTerceros, PartidoResultado } from "@/lib/standings";
import { DIECISEISAVOS, asignarTerceros } from "@/lib/bracket";
import { GRUPO_DE_EQUIPO } from "@/lib/equipos";

const GRUPOS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

async function resultadosGrupos(): Promise<PartidoResultado[]> {
  const { data } = await supabase
    .from("partido")
    .select("equipo_local, equipo_visitante, goles_local_real, goles_visitante_real")
    .eq("fase", "grupos").eq("estado", "finalizado");
  return (data ?? [])
    .filter((p) => p.goles_local_real != null && p.goles_visitante_real != null)
    .map((p) => ({
      grupo: GRUPO_DE_EQUIPO[p.equipo_local] ?? "?",
      local: p.equipo_local, visitante: p.equipo_visitante,
      gl: p.goles_local_real as number, gv: p.goles_visitante_real as number,
    }));
}

// GET: propone los 16 cruces de dieciseisavos con equipos reales.
export async function GET(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const res = await resultadosGrupos();
  const finalizados = res.length;
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  for (const g of GRUPOS) {
    const t = tablaGrupo(g, res);
    if (t[0]) primeros[g] = t[0].equipo;
    if (t[1]) segundos[g] = t[1].equipo;
  }
  const terceros = rankingTerceros(GRUPOS, res).slice(0, 8);
  const gruposTerceros = terceros.map((t) => t.grupo);
  const asign = asignarTerceros(gruposTerceros);
  const terceroDe: Record<string, string> = {};
  for (const t of terceros) terceroDe[t.grupo] = t.equipo;

  const resolver = (ph: string): string => {
    if (ph.startsWith("1")) return primeros[ph[1]] ?? ph;
    if (ph.startsWith("2")) return segundos[ph[1]] ?? ph;
    if (ph.startsWith("3")) {
      const grupo = asign[ph];
      return grupo ? (terceroDe[grupo] ?? ph) : ph;
    }
    return ph;
  };

  const cruces = DIECISEISAVOS.map((d) => ({
    codigo: d.codigo, fase: d.fase, fechaHora: d.fechaHora, sede: d.sede,
    localPlaceholder: d.local, visitantePlaceholder: d.visitante,
    local: resolver(d.local), visitante: resolver(d.visitante),
  }));

  return NextResponse.json({ listo: finalizados === 72, finalizados, cruces });
}

// POST: crea o actualiza filas de partido para una ronda. Body: { partidos: [{codigo,fase,local,visitante,fechaHora}] }
// Idempotente: si ya existe un partido con ese `codigo` en la sala, actualiza los equipos/fecha
// (útil cuando la ronda se publicó antes con placeholders "W73" y luego se conocen los ganadores).
// Nunca toca estado/goles/ganador ni las predicciones ligadas por partido_id.
export async function POST(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { partidos } = await req.json();
  const { data: sala } = await supabase.from("sala").select("id").limit(1).single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  let creados = 0;
  let actualizados = 0;
  for (const p of (partidos ?? []) as { codigo: number; fase: string; local: string; visitante: string; fechaHora: string }[]) {
    const { data: existente } = await supabase
      .from("partido")
      .select("id")
      .eq("sala_id", sala.id)
      .eq("codigo", p.codigo)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from("partido")
        .update({
          equipo_local: p.local,
          equipo_visitante: p.visitante,
          fecha_hora: p.fechaHora,
          fase: p.fase,
        })
        .eq("id", existente.id);
      if (error) return NextResponse.json({ error: "No se pudo actualizar: " + error.message }, { status: 500 });
      actualizados++;
    } else {
      const { error } = await supabase.from("partido").insert({
        sala_id: sala.id,
        equipo_local: p.local,
        equipo_visitante: p.visitante,
        fecha_hora: p.fechaHora,
        fase: p.fase,
        jornada: p.codigo,
        codigo: p.codigo,
        estado: "abierto",
      });
      if (error) return NextResponse.json({ error: "No se pudo crear: " + error.message }, { status: 500 });
      creados++;
    }
  }
  return NextResponse.json({ ok: true, creados, actualizados });
}
