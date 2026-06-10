import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Recortar espacios para que "Juan" y "Juan " no creen jugadores distintos.
  const codigo = (body.codigo ?? "").trim();
  const nombre = (body.nombre ?? "").trim();
  const pin = (body.pin ?? "").trim();

  if (!codigo || !nombre || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data: sala } = await supabase
    .from("sala")
    .select("id")
    .eq("codigo_acceso", codigo)
    .single();
  if (!sala) return NextResponse.json({ error: "Código de sala incorrecto" }, { status: 401 });

  const { data: existente } = await supabase
    .from("jugador")
    .select("id, pin_hash")
    .eq("sala_id", sala.id)
    .eq("nombre", nombre)
    .single();

  if (existente) {
    const ok = await bcrypt.compare(pin, existente.pin_hash);
    if (!ok) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    return NextResponse.json({ jugadorId: existente.id, nombre });
  }

  const pin_hash = await bcrypt.hash(pin, 10);
  const { data: nuevo, error } = await supabase
    .from("jugador")
    .insert({ sala_id: sala.id, nombre, pin_hash })
    .select("id")
    .single();
  if (error || !nuevo) {
    return NextResponse.json({ error: "No se pudo crear el jugador" }, { status: 500 });
  }
  return NextResponse.json({ jugadorId: nuevo.id, nombre });
}
