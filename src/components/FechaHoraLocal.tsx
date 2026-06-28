"use client";

export function FechaHoraLocal({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return <time dateTime={iso}>—</time>;
  const txt = new Intl.DateTimeFormat("es", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
  return <time dateTime={iso} className="tabular-nums">{txt}</time>;
}
