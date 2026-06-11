"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombres, setNombres] = useState<string[]>([]);
  const [seleccion, setSeleccion] = useState(""); // un nombre existente, "" (placeholder) o "__nuevo__"
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Carga los participantes ya registrados al escribir el código (con debounce),
  // para que los que ya entraron elijan su nombre y no lo escriban (evita duplicados por typo).
  useEffect(() => {
    const c = codigo.trim();
    if (!c) {
      setNombres([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/players?codigo=${encodeURIComponent(c)}`)
        .then((r) => r.json())
        .then((d) => setNombres(Array.isArray(d.nombres) ? d.nombres : []))
        .catch(() => setNombres([]));
    }, 400);
    return () => clearTimeout(t);
  }, [codigo]);

  const hayLista = nombres.length > 0;
  const esNuevo = !hayLista || seleccion === "__nuevo__";
  const nombre = esNuevo ? nombreNuevo : seleccion;

  async function entrar() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nombre, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      localStorage.setItem("jugadorId", data.jugadorId);
      localStorage.setItem("nombre", data.nombre);
      router.push("/jugar");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 text-sm font-medium placeholder-slate-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #0ea5e9 60%, #10b981 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div
            className="px-8 py-8 text-center"
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)",
            }}
          >
            <div className="mb-2 text-4xl leading-none select-none">⚽</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              Quiniela
              <br />
              <span className="text-amber-300">Mundial 2026</span>
            </h1>
            <p className="mt-2 text-xs font-medium text-indigo-200 tracking-widest uppercase">
              Pronóstica · Compite · Gana
            </p>
          </div>

          <div className="px-8 py-7 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Código de sala
                </label>
                <input
                  className={inputCls}
                  placeholder="Ej: MUNDIAL26"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tu nombre
                </label>

                {hayLista ? (
                  <>
                    <select
                      className={inputCls}
                      value={seleccion}
                      onChange={(e) => setSeleccion(e.target.value)}
                    >
                      <option value="">Elige tu nombre…</option>
                      {nombres.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                      <option value="__nuevo__">➕ Soy nuevo participante</option>
                    </select>
                    {esNuevo && (
                      <input
                        className={`${inputCls} mt-2`}
                        placeholder="Escribe tu nombre"
                        value={nombreNuevo}
                        onChange={(e) => setNombreNuevo(e.target.value)}
                      />
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Si ya entraste antes, elige tu nombre de la lista para no duplicarte.
                    </p>
                  </>
                ) : (
                  <input
                    className={inputCls}
                    placeholder="¿Cómo te llaman?"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  PIN (4 dígitos)
                </label>
                <input
                  className={`${inputCls} tracking-[0.4em]`}
                  placeholder="••••"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={entrar}
              disabled={loading}
              className="w-full rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-70 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
              style={{
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #0ea5e9 100%)",
              }}
            >
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/60 font-medium">
          USA · CANADA · MEXICO 2026
        </p>
      </div>
    </main>
  );
}
