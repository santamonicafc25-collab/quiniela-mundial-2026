import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

// Normaliza un nombre: recorta extremos y colapsa espacios internos repetidos.
// Así "Juan ", " Juan" y "Juan  Pérez" no generan jugadores distintos.
function normalizar(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const codigo = normalizar(body.codigo ?? "");
  const nombre = normalizar(body.nombre ?? "");
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

  // Buscar jugador existente comparando sin distinguir mayúsculas ni espacios,
  // para no crear duplicados (p. ej. "Guille" vs "guille " caen en el mismo jugador).
  const { data: jugadores } = await supabase
    .from("jugador")
    .select("id, nombre, pin_hash")
    .eq("sala_id", sala.id);

  const objetivo = nombre.toLowerCase();
  const existente = (jugadores ?? []).find(
    (j) => normalizar(j.nombre).toLowerCase() === objetivo
  );

  if (existente) {
    const ok = await bcrypt.compare(pin, existente.pin_hash);
    if (!ok) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    // Devuelve el nombre tal como está guardado (capitalización canónica).
    return NextResponse.json({ jugadorId: existente.id, nombre: existente.nombre });
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
