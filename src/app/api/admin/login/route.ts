import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { clave } = await req.json();
  const { data: sala } = await supabase
    .from("sala")
    .select("id, clave_admin_hash")
    .limit(1)
    .single();
  if (!sala) return NextResponse.json({ error: "Sin sala" }, { status: 500 });

  const ok = await bcrypt.compare(clave ?? "", sala.clave_admin_hash);
  if (!ok) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });

  // Token simple: la propia clave validada se reenvía en cada request admin y se revalida.
  return NextResponse.json({ ok: true });
}
