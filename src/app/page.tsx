"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #0ea5e9 60%, #10b981 100%)",
      }}
    >
      {/* Decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
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
        {/* Card */}
        <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header strip */}
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

          {/* Form */}
          <div className="px-8 py-7 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Código de sala
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 text-sm font-medium placeholder-slate-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="Ej: MUNDIAL26"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Tu nombre
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 text-sm font-medium placeholder-slate-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="¿Cómo te llaman?"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  PIN (4 dígitos)
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 text-sm font-medium placeholder-slate-400 tracking-[0.4em] transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
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

        {/* Subtle tagline below card */}
        <p className="mt-4 text-center text-xs text-white/60 font-medium">
          USA · CANADA · MEXICO 2026
        </p>
      </div>
    </main>
  );
}
