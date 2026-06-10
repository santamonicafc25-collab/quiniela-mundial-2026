"use client";

export function Tabs({
  tabs,
  activo,
  onChange,
}: {
  tabs: string[];
  activo: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5">
      {tabs.map((tab) => {
        const isActive = tab === activo;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1",
              isActive
                ? "bg-white text-violet-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/60",
            ].join(" ")}
            style={
              isActive
                ? {
                    background:
                      "linear-gradient(135deg, #fff 0%, #f5f3ff 100%)",
                  }
                : undefined
            }
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
