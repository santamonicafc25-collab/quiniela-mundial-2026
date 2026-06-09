import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

// Cliente con service role: solo se usa en API routes (server), nunca en el cliente.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
