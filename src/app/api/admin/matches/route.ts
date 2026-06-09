import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../_auth";

export async function POST(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { data: sala } = await supabase.from("sala").select("id").limit(1).single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  const { error } = await supabase.from("partido").insert({
    sala_id: sala.id,
    equipo_local: body.equipoLocal,
    equipo_visitante: body.equipoVisitante,
    fecha_hora: body.fechaHora,
    fase: body.fase,
    jornada: body.jornada,
    estado: "abierto",
  });
  if (error) return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const clave = req.headers.get("x-admin-clave");
  if (!(await validarAdmin(clave))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data } = await supabase
    .from("partido")
    .select("*")
    .order("fecha_hora", { ascending: true });
  return NextResponse.json({ partidos: data ?? [] });
}
