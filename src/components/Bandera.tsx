import { flagUrl } from "@/lib/equipos";

export function Bandera({ equipo, size = 24 }: { equipo: string; size?: number }) {
  const url = flagUrl(equipo);
  if (!url) {
    return (
      <span
        className="inline-flex items-center justify-center rounded bg-slate-200 text-[10px] font-semibold text-slate-600"
        style={{ width: size * 1.4, height: size }}
        aria-label={equipo}
      >
        {equipo.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={equipo} width={size * 1.4} height={size}
      className="inline-block rounded object-cover shadow-sm ring-1 ring-black/5" style={{ height: size }} />
  );
}
