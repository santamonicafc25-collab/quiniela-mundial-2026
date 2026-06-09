export type FilaRanking = {
  nombre: string;
  puntos: number;
  exactos: number;
};

const MEDALS = ["🥇", "🥈", "🥉"] as const;

const PODIO_CONFIG = [
  {
    // 2nd place — left
    rankIndex: 1,
    heightClass: "h-20",
    bgClass: "bg-gradient-to-b from-slate-100 to-slate-200",
    borderClass: "border-slate-200",
    nameSize: "text-sm",
    ptsSize: "text-base",
    avatarSize: "h-12 w-12",
    avatarRing: "ring-2 ring-slate-300",
    avatarBg: "bg-slate-200 text-slate-500",
    order: 1,
  },
  {
    // 1st place — center (tallest)
    rankIndex: 0,
    heightClass: "h-28",
    bgClass: "bg-gradient-to-b from-amber-400 to-amber-500",
    borderClass: "border-amber-300",
    nameSize: "text-sm font-bold",
    ptsSize: "text-lg",
    avatarSize: "h-14 w-14",
    avatarRing: "ring-4 ring-amber-300 ring-offset-2 ring-offset-amber-400",
    avatarBg: "bg-amber-300 text-amber-800",
    order: 0,
  },
  {
    // 3rd place — right
    rankIndex: 2,
    heightClass: "h-14",
    bgClass: "bg-gradient-to-b from-orange-100 to-orange-200",
    borderClass: "border-orange-200",
    nameSize: "text-sm",
    ptsSize: "text-base",
    avatarSize: "h-10 w-10",
    avatarRing: "ring-2 ring-orange-200",
    avatarBg: "bg-orange-100 text-orange-600",
    order: 2,
  },
] as const;

function initials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Podio({ top3 }: { top3: FilaRanking[] }) {
  if (top3.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white py-10 text-center shadow-sm">
        <p className="text-sm text-slate-400 italic">Sin resultados aún</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="px-5 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500">
        <h2 className="text-sm font-bold tracking-widest text-white uppercase">
          Podio
        </h2>
      </div>

      {/* Podium visual */}
      <div className="px-6 pt-8 pb-4">
        {/* Name + avatar row (above the blocks) */}
        <div className="flex items-end justify-center gap-3 mb-0">
          {PODIO_CONFIG.map((cfg) => {
            const fila = top3[cfg.rankIndex];
            if (!fila) return <div key={cfg.rankIndex} className="w-24" />;

            const isFirst = cfg.rankIndex === 0;

            return (
              <div
                key={cfg.rankIndex}
                className="flex flex-col items-center gap-1 w-24"
              >
                {/* Medal */}
                <span className="text-2xl leading-none">{MEDALS[cfg.rankIndex]}</span>

                {/* Avatar */}
                <div
                  className={`${cfg.avatarSize} ${cfg.avatarRing} rounded-full flex items-center justify-center font-bold text-sm ${cfg.avatarBg} transition-transform hover:scale-105`}
                >
                  {initials(fila.nombre)}
                </div>

                {/* Name */}
                <p
                  className={`${cfg.nameSize} text-slate-800 text-center leading-tight max-w-[80px] truncate`}
                  title={fila.nombre}
                >
                  {fila.nombre}
                </p>

                {/* Points */}
                <p
                  className={`${cfg.ptsSize} tabular-nums font-bold ${
                    isFirst ? "text-amber-500" : "text-slate-700"
                  }`}
                >
                  {fila.puntos}
                  <span className="text-[11px] font-normal text-slate-400 ml-0.5">pts</span>
                </p>

                {/* Exactos badge */}
                {fila.exactos > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 tabular-nums">
                    ★ {fila.exactos} exactos
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* The actual podium blocks */}
        <div className="flex items-end justify-center gap-3 mt-3">
          {PODIO_CONFIG.map((cfg) => {
            const fila = top3[cfg.rankIndex];
            return (
              <div
                key={cfg.rankIndex}
                className={`w-24 ${cfg.heightClass} ${cfg.bgClass} rounded-t-lg border ${cfg.borderClass} flex items-center justify-center`}
              >
                <span className="text-2xl font-black text-white/60 tabular-nums select-none">
                  {cfg.rankIndex + 1}
                </span>
                {!fila && (
                  <span className="absolute text-[11px] text-slate-400 italic" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full ranking list if there are more than 3 */}
      {top3.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-0">
          {top3.map((fila, idx) => (
            <div
              key={fila.nombre + idx}
              className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
            >
              <span className="w-6 text-center text-sm font-bold tabular-nums text-slate-400">
                {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                {fila.nombre}
              </span>
              <span className="tabular-nums text-sm font-bold text-slate-700">
                {fila.puntos}
                <span className="ml-0.5 text-[11px] font-normal text-slate-400">pts</span>
              </span>
              {fila.exactos > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-500 tabular-nums">
                  ★{fila.exactos}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
