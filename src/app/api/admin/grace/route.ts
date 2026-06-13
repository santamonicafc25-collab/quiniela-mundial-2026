import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validarAdmin } from "../_auth";

export async function GET(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data: sala } = await supabase.from("sala").select("gracia_abierta").single();
  return NextResponse.json({ graciaAbierta: sala?.gracia_abierta ?? false });
}

export async function POST(req: NextRequest) {
  if (!(await validarAdmin(req.headers.get("x-admin-clave")))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { graciaAbierta } = await req.json();
  if (typeof graciaAbierta !== "boolean") {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }
  const { data: sala } = await supabase.from("sala").select("id").single();
  if (!sala) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });

  const { error } = await supabase
    .from("sala")
    .update({ gracia_abierta: graciaAbierta })
    .eq("id", sala.id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  return NextResponse.json({ ok: true, graciaAbierta });
}
