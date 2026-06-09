// Mapa de los 48 equipos del Mundial 2026 a su código ISO 3166-1 alpha-2 (para flagcdn).
// Inglaterra y Escocia usan los códigos de subdivisión que soporta flagcdn.
export const EQUIPOS: Record<string, string> = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Canadá": "ca", "Bosnia y Herzegovina": "ba", "Catar": "qa", "Suiza": "ch",
  "Estados Unidos": "us", "Paraguay": "py", "Brasil": "br", "Marruecos": "ma",
  "Haití": "ht", "Escocia": "gb-sct", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curazao": "cw", "Costa de Marfil": "ci", "Ecuador": "ec",
  "Países Bajos": "nl", "Japón": "jp", "Suecia": "se", "Túnez": "tn",
  "Bélgica": "be", "Egipto": "eg", "Irán": "ir", "Nueva Zelanda": "nz",
  "España": "es", "Cabo Verde": "cv", "Arabia Saudita": "sa", "Uruguay": "uy",
  "Francia": "fr", "Senegal": "sn", "Irak": "iq", "Noruega": "no",
  "Argentina": "ar", "Argelia": "dz", "Austria": "at", "Jordania": "jo",
  "Portugal": "pt", "RD Congo": "cd", "Uzbekistán": "uz", "Colombia": "co",
  "Inglaterra": "gb-eng", "Croacia": "hr", "Ghana": "gh", "Panamá": "pa",
};

// Mapa equipo→grupo (de la carga oficial de los 72 partidos). DRY: fuente única.
export const GRUPO_DE_EQUIPO: Record<string, string> = {
  "México":"A","Sudáfrica":"A","Corea del Sur":"A","Chequia":"A",
  "Canadá":"B","Bosnia y Herzegovina":"B","Catar":"B","Suiza":"B",
  "Brasil":"C","Marruecos":"C","Haití":"C","Escocia":"C",
  "Estados Unidos":"D","Paraguay":"D","Australia":"D","Turquía":"D",
  "Alemania":"E","Curazao":"E","Costa de Marfil":"E","Ecuador":"E",
  "Países Bajos":"F","Japón":"F","Suecia":"F","Túnez":"F",
  "Bélgica":"G","Egipto":"G","Irán":"G","Nueva Zelanda":"G",
  "España":"H","Cabo Verde":"H","Arabia Saudita":"H","Uruguay":"H",
  "Francia":"I","Senegal":"I","Irak":"I","Noruega":"I",
  "Argentina":"J","Argelia":"J","Austria":"J","Jordania":"J",
  "Portugal":"K","RD Congo":"K","Uzbekistán":"K","Colombia":"K",
  "Inglaterra":"L","Croacia":"L","Ghana":"L","Panamá":"L",
};

export function isoDeEquipo(nombre: string): string | null {
  return EQUIPOS[nombre] ?? null;
}

export function flagUrl(nombre: string): string | null {
  const iso = isoDeEquipo(nombre);
  return iso ? `https://flagcdn.com/${iso}.svg` : null;
}
