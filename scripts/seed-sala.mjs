// Uso: node scripts/seed-sala.mjs <codigo_acceso> <clave_admin>
// Imprime el SQL INSERT para pegar en Supabase con el hash ya calculado.
import bcrypt from "bcryptjs";

const [codigo, clave] = process.argv.slice(2);
if (!codigo || !clave) {
  console.error("Uso: node scripts/seed-sala.mjs <codigo_acceso> <clave_admin>");
  process.exit(1);
}
const hash = bcrypt.hashSync(clave, 10);
console.log(
  `insert into sala (codigo_acceso, clave_admin_hash) values ('${codigo}', '${hash}');`
);
