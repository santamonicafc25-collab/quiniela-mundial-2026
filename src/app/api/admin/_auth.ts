import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

/** Helper reutilizable: valida la clave admin enviada en el header. */
export async function validarAdmin(clave: string | null): Promise<boolean> {
  if (!clave) return false;
  const { data: sala } = await supabase
    .from("sala")
    .select("clave_admin_hash")
    .limit(1)
    .single();
  if (!sala) return false;
  return bcrypt.compare(clave, sala.clave_admin_hash);
}
