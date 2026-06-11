import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Lista los nombres de los participantes ya registrados en la sala (para elegir en el login
// y evitar duplicados por error de tipeo). Solo devuelve nombres, nada sensible.
export async function GET(req: NextRequest) {
  const codigo = (req.nextUrl.searchParams.get("codigo") ?? "").trim();
  if (!codigo) return NextResponse.json({ nombres: [] });

  const { data: sala } = await supabase
    .from("sala")
    .select("id")
    .eq("codigo_acceso", codigo)
    .single();
  if (!sala) return NextResponse.json({ nombres: [] });

  const { data: jugadores } = await supabase
    .from("jugador")
    .select("nombre")
    .eq("sala_id", sala.id)
    .order("nombre", { ascending: true });

  return NextResponse.json({ nombres: (jugadores ?? []).map((j) => j.nombre) });
}
