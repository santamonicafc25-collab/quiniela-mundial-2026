"use client";
import { useState, useEffect, useMemo } from "react";
import { Bandera } from "@/components/Bandera";
import { FechaHoraLocal } from "@/components/FechaHoraLocal";
import { RONDAS_SIGUIENTES } from "@/lib/bracket";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Partido {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  fase: string;
  jornada: number;
  codigo: number;
  goles_local_real: number | null;
  goles_visitante_real: number | null;
  ganador: string | null;
  estado: string;
}

interface Cruce {
  codigo: number;
  fase: string;
  fechaHora: string;
  sede: string;
  localPlaceholder: string;
  visitantePlaceholder: string;
  local: string;
  visitante: string;
}

interface RankingRow {
  nombre: string;
  puntos: number;
  exactos: number;
}

type Tab = "partidos" | "eliminatorias" | "ranking" | "auditoria";
type FaseFilter = "todas" | "grupos" | "dieciseisavos" | "octavos" | "cuartos" | "semis" | "tercer_puesto" | "final";

// ─────────────────────────────────────────────
// Helper: resolve W## / RU## placeholders
// ─────────────────────────────────────────────
// Ganador de un partido: el marcado explícitamente (penales), o si no, el que se
// deduce del marcador cuando no hubo empate. Así los cruces siguientes se resuelven
// aunque el admin no haya pulsado "ganador" (siempre que el resultado no sea empate).
function ganadorDe(p: Partido): string | null {
  if (p.ganador) return p.ganador;
  const gl = p.goles_local_real;
  const gv = p.goles_visitante_real;
  if (gl != null && gv != null && gl !== gv) {
    return gl > gv ? p.equipo_local : p.equipo_visitante;
  }
  return null;
}

function resolvePlaceholder(ph: string, partidos: Partido[]): { equipo: string | null; falta: boolean } {
  if (ph.startsWith("W")) {
    const cod = parseInt(ph.slice(1), 10);
    const p = partidos.find((x) => x.codigo === cod);
    const g = p ? ganadorDe(p) : null;
    if (!g) return { equipo: null, falta: true };
    return { equipo: g, falta: false };
  }
  if (ph.startsWith("RU")) {
    const cod = parseInt(ph.slice(2), 10);
    const p = partidos.find((x) => x.codigo === cod);
    const g = p ? ganadorDe(p) : null;
    if (!p || !g) return { equipo: null, falta: true };
    const perdedor = p.equipo_local === g ? p.equipo_visitante : p.equipo_local;
    return { equipo: perdedor, falta: false };
  }
  return { equipo: ph, falta: false };
}

// ─────────────────────────────────────────────
// Sub-component: Match row
// ─────────────────────────────────────────────
interface MatchRowProps {
  partido: Partido;
  clave: string;
  onSaved: () => void;
}

function MatchRow({ partido, clave, onSaved }: MatchRowProps) {
  const [gl, setGl] = useState(partido.goles_local_real?.toString() ?? "");
  const [gv, setGv] = useState(partido.goles_visitante_real?.toString() ?? "");
  const [ganador, setGanador] = useState(partido.ganador ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const esElim = partido.fase !== "grupos";

  // Auto-select winner when scores differ
  useEffect(() => {
    if (!esElim) return;
    const l = parseInt(gl);
    const v = parseInt(gv);
    if (!isNaN(l) && !isNaN(v) && l !== v) {
      setGanador(l > v ? partido.equipo_local : partido.equipo_visitante);
    }
  }, [gl, gv, esElim, partido.equipo_local, partido.equipo_visitante]);

  async function guardar() {
    setSaving(true);
    const body: Record<string, unknown> = {
      partidoId: partido.id,
      golesLocal: Number(gl),
      golesVisitante: Number(gv),
    };
    if (esElim) body.ganador = ganador;
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved();
    }
  }

  const tieneMarcador = partido.goles_local_real !== null;

  return (
    <div className={`grid gap-3 p-4 rounded-xl border transition-all ${tieneMarcador ? "bg-emerald-50/60 border-emerald-200" : "bg-white border-slate-100"}`}
      style={{ gridTemplateColumns: "1fr auto" }}>
      {/* Left: info */}
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
            {partido.fase.replace("_", " ")}
          </span>
          <span className="text-xs text-slate-400 tabular-nums">
            <FechaHoraLocal iso={partido.fecha_hora} />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bandera equipo={partido.equipo_local} size={20} />
            <span className="text-sm font-semibold text-slate-800 truncate">{partido.equipo_local}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number" min={0} max={99}
              value={gl}
              onChange={(e) => setGl(e.target.value)}
              className="w-12 text-center text-base font-bold tabular-nums border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <span className="text-slate-400 font-bold text-sm">–</span>
            <input
              type="number" min={0} max={99}
              value={gv}
              onChange={(e) => setGv(e.target.value)}
              className="w-12 text-center text-base font-bold tabular-nums border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-semibold text-slate-800 truncate text-right">{partido.equipo_visitante}</span>
            <Bandera equipo={partido.equipo_visitante} size={20} />
          </div>
        </div>
        {esElim && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Avanza:</label>
            <select
              value={ganador}
              onChange={(e) => setGanador(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            >
              <option value="">— seleccionar —</option>
              <option value={partido.equipo_local}>{partido.equipo_local}</option>
              <option value={partido.equipo_visitante}>{partido.equipo_visitante}</option>
            </select>
          </div>
        )}
      </div>
      {/* Right: save button */}
      <div className="flex flex-col justify-center items-end gap-1">
        <button
          onClick={guardar}
          disabled={saving}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
        >
          {saving ? "..." : saved ? "✓ Listo" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: PARTIDOS
// ─────────────────────────────────────────────
function TabPartidos({ clave }: { clave: string }) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [faseFilter, setFaseFilter] = useState<FaseFilter>("todas");
  const [fechaFilter, setFechaFilter] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/admin/matches", { headers: { "x-admin-clave": clave } });
    if (res.ok) {
      const data = await res.json();
      setPartidos(data.partidos ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    return partidos
      .filter((p) => {
        if (faseFilter !== "todas" && p.fase !== faseFilter) return false;
        if (soloPendientes && p.goles_local_real !== null) return false;
        if (fechaFilter) {
          const fechaPartido = new Date(p.fecha_hora).toLocaleDateString("en-CA"); // yyyy-mm-dd
          if (fechaPartido !== fechaFilter) return false;
        }
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase();
          if (!p.equipo_local.toLowerCase().includes(q) && !p.equipo_visitante.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
  }, [partidos, faseFilter, soloPendientes, fechaFilter, busqueda]);

  const conResultado = partidos.filter((p) => p.goles_local_real !== null).length;

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-800 tabular-nums">{conResultado}</span>
          <span> / </span>
          <span className="font-bold text-slate-800 tabular-nums">{partidos.length}</span>
          <span> con resultado</span>
        </p>
        <button onClick={cargar} className="text-xs text-violet-600 hover:text-violet-800 font-medium">↻ Actualizar</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={faseFilter}
            onChange={(e) => setFaseFilter(e.target.value as FaseFilter)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          >
            <option value="todas">Todas las fases</option>
            <option value="grupos">Grupos</option>
            <option value="dieciseisavos">Dieciseisavos</option>
            <option value="octavos">Octavos</option>
            <option value="cuartos">Cuartos</option>
            <option value="semis">Semis</option>
            <option value="tercer_puesto">Tercer puesto</option>
            <option value="final">Final</option>
          </select>
          <input
            type="date"
            value={fechaFilter}
            onChange={(e) => setFechaFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
              className="rounded accent-violet-600 w-4 h-4"
            />
            <span className="text-sm text-slate-700">Solo pendientes</span>
          </label>
        </div>
        <p className="text-xs text-slate-400">Mostrando <span className="font-semibold text-slate-600">{filtrados.length}</span> partidos</p>
      </div>

      {/* Match list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando partidos...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No hay partidos con ese filtro</div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => (
            <MatchRow key={p.id} partido={p} clave={clave} onSaved={cargar} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: ELIMINATORIAS
// ─────────────────────────────────────────────
function TabEliminatorias({ clave }: { clave: string }) {
  const [knockoutData, setKnockoutData] = useState<{ listo: boolean; finalizados: number; cruces: Cruce[] } | null>(null);
  const [cruceEdits, setCruceEdits] = useState<Record<number, { local: string; visitante: string }>>({});
  const [loadingKo, setLoadingKo] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [msg, setMsg] = useState<{ text: string; tipo: "ok" | "error" | "info" } | null>(null);

  // Rondas siguientes state
  const [octavosEdits, setOctavosEdits] = useState<{ codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[]>([]);
  const [cuartosEdits, setCuartosEdits] = useState<{ codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[]>([]);
  const [semisEdits, setSemisEdits] = useState<{ codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[]>([]);
  const [finalEdits, setFinalEdits] = useState<{ codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[]>([]);

  // Al aparecer un mensaje (publicación/errores), lo traemos a la vista: el botón
  // "Publicar" puede quedar muy abajo y el banner de estado está arriba.
  useEffect(() => {
    if (msg) document.getElementById("ko-msg")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [msg]);

  async function cargarPartidos() {
    const res = await fetch("/api/admin/matches", { headers: { "x-admin-clave": clave } });
    if (res.ok) {
      const d = await res.json();
      setPartidos(d.partidos ?? []);
    }
  }

  async function cargarPropuesta() {
    setLoadingKo(true);
    setMsg(null);
    try {
      await cargarPartidos();
      const res = await fetch("/api/admin/knockout", { headers: { "x-admin-clave": clave } });
      const d = await res.json();
      if (!res.ok) {
        setMsg({ text: d.error ?? "Error al cargar propuesta", tipo: "error" });
      } else {
        setKnockoutData(d);
        const edits: Record<number, { local: string; visitante: string }> = {};
        for (const c of d.cruces) edits[c.codigo] = { local: c.local, visitante: c.visitante };
        setCruceEdits(edits);
      }
    } catch (e) {
      setMsg({ text: "Error de red al cargar propuesta: " + (e instanceof Error ? e.message : String(e)), tipo: "error" });
    } finally {
      setLoadingKo(false);
    }
  }

  async function publicarDieciseisavos() {
    if (!knockoutData) return;
    const partidosBody = knockoutData.cruces.map((c) => ({
      codigo: c.codigo, fase: "dieciseisavos",
      local: cruceEdits[c.codigo]?.local ?? c.local,
      visitante: cruceEdits[c.codigo]?.visitante ?? c.visitante,
      fechaHora: c.fechaHora,
    }));
    try {
      const res = await fetch("/api/admin/knockout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-clave": clave },
        body: JSON.stringify({ partidos: partidosBody }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ text: `Dieciseisavos publicados (${(d.creados ?? 0) + (d.actualizados ?? 0)} partidos)`, tipo: "ok" });
        await cargarPartidos();
      } else {
        setMsg({ text: d.error ?? "Error al publicar", tipo: "error" });
      }
    } catch (e) {
      setMsg({ text: "Error de red: " + (e instanceof Error ? e.message : String(e)), tipo: "error" });
    }
    setTimeout(() => setMsg(null), 5000);
  }

  function generarRonda(fase: string) {
    const llaves = RONDAS_SIGUIENTES.filter((l) => l.fase === fase);
    const resueltas = llaves.map((l) => {
      const loc = resolvePlaceholder(l.local, partidos);
      const vis = resolvePlaceholder(l.visitante, partidos);
      return {
        codigo: l.codigo, fase: l.fase,
        local: loc.equipo ?? l.local,
        visitante: vis.equipo ?? l.visitante,
        fechaHora: l.fechaHora, sede: l.sede,
      };
    });
    if (fase === "octavos") setOctavosEdits(resueltas);
    else if (fase === "cuartos") setCuartosEdits(resueltas);
    else if (fase === "semis") setSemisEdits(resueltas);
    else if (fase === "final" || fase === "tercer_puesto") {
      const finalY3 = RONDAS_SIGUIENTES.filter((l) => l.fase === "final" || l.fase === "tercer_puesto");
      const r = finalY3.map((l) => {
        const loc = resolvePlaceholder(l.local, partidos);
        const vis = resolvePlaceholder(l.visitante, partidos);
        return {
          codigo: l.codigo, fase: l.fase,
          local: loc.equipo ?? l.local,
          visitante: vis.equipo ?? l.visitante,
          fechaHora: l.fechaHora, sede: l.sede,
        };
      });
      setFinalEdits(r);
    }
  }

  async function publicarRonda(
    edits: { codigo: number; fase: string; local: string; visitante: string; fechaHora: string }[],
    nombre: string
  ) {
    try {
      const res = await fetch("/api/admin/knockout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-clave": clave },
        body: JSON.stringify({ partidos: edits }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ text: `${nombre} publicados (${(d.creados ?? 0) + (d.actualizados ?? 0)} partidos)`, tipo: "ok" });
        await cargarPartidos();
      } else {
        setMsg({ text: d.error ?? "Error", tipo: "error" });
      }
    } catch (e) {
      setMsg({ text: "Error de red: " + (e instanceof Error ? e.message : String(e)), tipo: "error" });
    }
    setTimeout(() => setMsg(null), 5000);
  }

  function hayFaltantes(llaves: typeof RONDAS_SIGUIENTES, fase: string) {
    const target = fase === "final_3er"
      ? llaves.filter(l => l.fase === "final" || l.fase === "tercer_puesto")
      : llaves.filter(l => l.fase === fase);
    return target.some((l) => {
      const loc = resolvePlaceholder(l.local, partidos);
      const vis = resolvePlaceholder(l.visitante, partidos);
      return loc.falta || vis.falta;
    });
  }

  function updateRondaEdit(
    edits: { codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[],
    setter: (v: typeof edits) => void,
    codigo: number,
    field: "local" | "visitante",
    value: string
  ) {
    setter(edits.map(e => e.codigo === codigo ? { ...e, [field]: value } : e));
  }

  return (
    <div className="space-y-6">
      {/* Mensaje */}
      {msg && (
        <div id="ko-msg" className={`px-4 py-3 rounded-xl text-sm font-medium ${
          msg.tipo === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          msg.tipo === "error" ? "bg-red-50 text-red-700 border border-red-200" :
          "bg-sky-50 text-sky-700 border border-sky-200"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Sección Dieciseisavos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Dieciseisavos de Final</h3>
            {knockoutData && (
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-semibold tabular-nums">{knockoutData.finalizados}</span>/72 grupos finalizados
                {!knockoutData.listo && <span className="ml-2 text-amber-600 text-xs">(faltan resultados de grupos)</span>}
              </p>
            )}
          </div>
          <button
            onClick={cargarPropuesta}
            disabled={loadingKo}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            {loadingKo ? "Cargando..." : "Cargar propuesta"}
          </button>
        </div>

        {knockoutData && (
          <div className="space-y-2">
            {knockoutData.cruces.map((c) => (
              <div key={c.codigo} className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 w-6 tabular-nums">{c.codigo}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Bandera equipo={cruceEdits[c.codigo]?.local ?? c.local} size={16} />
                    <input
                      value={cruceEdits[c.codigo]?.local ?? c.local}
                      onChange={(e) => setCruceEdits(prev => ({ ...prev, [c.codigo]: { ...prev[c.codigo], local: e.target.value } }))}
                      className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400 tabular-nums pl-1">{c.localPlaceholder}</p>
                </div>
                <span className="text-slate-400 text-xs font-bold px-1">vs</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Bandera equipo={cruceEdits[c.codigo]?.visitante ?? c.visitante} size={16} />
                    <input
                      value={cruceEdits[c.codigo]?.visitante ?? c.visitante}
                      onChange={(e) => setCruceEdits(prev => ({ ...prev, [c.codigo]: { ...prev[c.codigo], visitante: e.target.value } }))}
                      className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400 tabular-nums pl-1">{c.visitantePlaceholder}</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-xs text-slate-500 truncate">{c.sede}</p>
                  <p className="text-xs text-slate-400 tabular-nums"><FechaHoraLocal iso={c.fechaHora} /></p>
                </div>
              </div>
            ))}
            <button
              onClick={publicarDieciseisavos}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-2 transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9)" }}
            >
              Publicar dieciseisavos
            </button>
          </div>
        )}
      </div>

      {/* Rondas siguientes */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Rondas siguientes</h3>

        {/* Octavos */}
        <RondaSection
          titulo="Octavos de Final"
          fase="octavos"
          edits={octavosEdits}
          setEdits={setOctavosEdits}
          falta={hayFaltantes(RONDAS_SIGUIENTES, "octavos")}
          onGenerar={() => { cargarPartidos().then(() => generarRonda("octavos")); }}
          onPublicar={() => publicarRonda(octavosEdits, "Octavos")}
          updateEdit={(cod, field, val) => updateRondaEdit(octavosEdits, setOctavosEdits, cod, field, val)}
        />

        {/* Cuartos */}
        <RondaSection
          titulo="Cuartos de Final"
          fase="cuartos"
          edits={cuartosEdits}
          setEdits={setCuartosEdits}
          falta={hayFaltantes(RONDAS_SIGUIENTES, "cuartos")}
          onGenerar={() => { cargarPartidos().then(() => generarRonda("cuartos")); }}
          onPublicar={() => publicarRonda(cuartosEdits, "Cuartos")}
          updateEdit={(cod, field, val) => updateRondaEdit(cuartosEdits, setCuartosEdits, cod, field, val)}
        />

        {/* Semis */}
        <RondaSection
          titulo="Semifinales"
          fase="semis"
          edits={semisEdits}
          setEdits={setSemisEdits}
          falta={hayFaltantes(RONDAS_SIGUIENTES, "semis")}
          onGenerar={() => { cargarPartidos().then(() => generarRonda("semis")); }}
          onPublicar={() => publicarRonda(semisEdits, "Semifinales")}
          updateEdit={(cod, field, val) => updateRondaEdit(semisEdits, setSemisEdits, cod, field, val)}
        />

        {/* Final + 3er puesto */}
        <RondaSection
          titulo="Final y 3er Puesto"
          fase="final_3er"
          edits={finalEdits}
          setEdits={setFinalEdits}
          falta={hayFaltantes(RONDAS_SIGUIENTES, "final_3er")}
          onGenerar={() => {
            cargarPartidos().then(() => {
              const finalY3 = RONDAS_SIGUIENTES.filter((l) => l.fase === "final" || l.fase === "tercer_puesto");
              const r = finalY3.map((l) => {
                const loc = resolvePlaceholder(l.local, partidos);
                const vis = resolvePlaceholder(l.visitante, partidos);
                return {
                  codigo: l.codigo, fase: l.fase,
                  local: loc.equipo ?? l.local,
                  visitante: vis.equipo ?? l.visitante,
                  fechaHora: l.fechaHora, sede: l.sede,
                };
              });
              setFinalEdits(r);
            });
          }}
          onPublicar={() => publicarRonda(finalEdits, "Final y 3er puesto")}
          updateEdit={(cod, field, val) => updateRondaEdit(finalEdits, setFinalEdits, cod, field, val)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-component: RondaSection
// ─────────────────────────────────────────────
interface RondaSectionProps {
  titulo: string;
  fase: string;
  edits: { codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[];
  setEdits: (v: { codigo: number; fase: string; local: string; visitante: string; fechaHora: string; sede: string }[]) => void;
  falta: boolean;
  onGenerar: () => void;
  onPublicar: () => void;
  updateEdit: (codigo: number, field: "local" | "visitante", value: string) => void;
}

function RondaSection({ titulo, edits, falta, onGenerar, onPublicar, updateEdit }: RondaSectionProps) {
  // Un valor sigue siendo un placeholder sin resolver si está vacío o es del tipo "W73"/"RU101".
  // Bloqueamos "Publicar" mientras algún cruce editado tenga un placeholder, para no guardar
  // filas sin equipo real (que saldrían sin bandera ni nombre en el bracket).
  const esPlaceholder = (v: string) => v.trim() === "" || /^W\d+$/.test(v.trim()) || /^RU\d+$/.test(v.trim());
  const editsIncompletas = edits.some((e) => esPlaceholder(e.local) || esPlaceholder(e.visitante));
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-semibold text-slate-700 text-sm">{titulo}</h4>
        <button
          onClick={onGenerar}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-300 text-violet-700 hover:bg-violet-50 transition-all"
        >
          Generar {titulo}
        </button>
      </div>

      {(falta || editsIncompletas) && edits.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Algunos cruces aún no tienen ganador. Edita los equipos manualmente o espera a que estén los resultados.
        </p>
      )}

      {edits.length > 0 && (
        <div className="space-y-2">
          {edits.map((e) => (
            <div key={e.codigo} className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center text-sm">
              <span className="text-xs text-slate-400 w-6 tabular-nums">{e.codigo}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Bandera equipo={e.local} size={16} />
                <input
                  value={e.local}
                  onChange={(ev) => updateEdit(e.codigo, "local", ev.target.value)}
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold px-1">vs</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Bandera equipo={e.visitante} size={16} />
                <input
                  value={e.visitante}
                  onChange={(ev) => updateEdit(e.codigo, "visitante", ev.target.value)}
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 truncate max-w-[80px]">{e.sede}</p>
              </div>
            </div>
          ))}
          <button
            onClick={onPublicar}
            disabled={editsIncompletas}
            title={editsIncompletas ? "Hay cruces sin equipo real (ej. W73). Espera los ganadores o edita los equipos manualmente." : undefined}
            className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            Publicar {titulo}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: RANKING
// ─────────────────────────────────────────────
function TabRanking() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((d) => { setRanking(d.ranking ?? []); setLoading(false); });
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Tabla de Posiciones</h3>
        <p className="text-xs text-slate-400 mt-0.5">{ranking.length} participantes</p>
      </div>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando ranking...</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {ranking.map((r, i) => (
            <div
              key={r.nombre}
              className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 ${
                i === 0 ? "bg-amber-50/70" : i === 1 ? "bg-slate-50/50" : i === 2 ? "bg-orange-50/40" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i === 0 ? "bg-amber-400 text-white" :
                i === 1 ? "bg-slate-400 text-white" :
                i === 2 ? "bg-orange-400 text-white" :
                "bg-slate-100 text-slate-500"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{r.nombre}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold tabular-nums text-slate-800">{r.puntos}</p>
                <p className="text-xs text-slate-400 tabular-nums">{r.exactos} exactos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Types: Auditoría
// ─────────────────────────────────────────────
interface PronosticoAuditoria {
  partidoId: string;
  equipoLocal: string;
  equipoVisitante: string;
  fase: string;
  jornada: number;
  fechaHora: string | null;
  golesLocal: number;
  golesVisitante: number;
  puntos: number;
}

interface JugadorAuditoria {
  id: string;
  nombre: string;
  fechaRegistro: string;
  total: number;
  pronosticos: PronosticoAuditoria[];
}

interface AuditoriaResponse {
  jugadores: JugadorAuditoria[];
}

// ─────────────────────────────────────────────
// Helper: CSV download
// ─────────────────────────────────────────────
function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function descargarCsvJugador(jugador: JugadorAuditoria) {
  const headers = [
    "participante",
    "fecha_registro",
    "fase",
    "jornada",
    "equipo_local",
    "equipo_visitante",
    "goles_local_pred",
    "goles_visitante_pred",
    "puntos",
  ];
  const rows = jugador.pronosticos.map((p) =>
    [
      jugador.nombre,
      jugador.fechaRegistro,
      p.fase,
      p.jornada,
      p.equipoLocal,
      p.equipoVisitante,
      p.golesLocal,
      p.golesVisitante,
      p.puntos,
    ]
      .map(escapeCsvField)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditoria_${jugador.nombre.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function descargarCsvTodos(jugadores: JugadorAuditoria[]) {
  const headers = [
    "participante",
    "fecha_registro",
    "fase",
    "jornada",
    "equipo_local",
    "equipo_visitante",
    "goles_local_pred",
    "goles_visitante_pred",
    "puntos",
  ];
  const rows = jugadores.flatMap((jugador) =>
    jugador.pronosticos.map((p) =>
      [
        jugador.nombre,
        jugador.fechaRegistro,
        p.fase,
        p.jornada,
        p.equipoLocal,
        p.equipoVisitante,
        p.golesLocal,
        p.golesVisitante,
        p.puntos,
      ]
        .map(escapeCsvField)
        .join(",")
    )
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "auditoria_todos_los_participantes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Sub-component: Fila de pronóstico
// ─────────────────────────────────────────────
function PronosticoRow({ p }: { p: PronosticoAuditoria }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-3 py-2 text-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Bandera equipo={p.equipoLocal} size={16} />
          <span className="text-slate-700 font-medium">{p.equipoLocal}</span>
          <span className="text-slate-400 text-xs">vs</span>
          <span className="text-slate-700 font-medium">{p.equipoVisitante}</span>
          <Bandera equipo={p.equipoVisitante} size={16} />
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-slate-500 capitalize whitespace-nowrap">
        {p.fase.replace("_", " ")}
      </td>
      <td className="px-3 py-2 text-sm font-bold tabular-nums text-center text-slate-800 whitespace-nowrap">
        {p.golesLocal} – {p.golesVisitante}
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
            p.puntos === 2
              ? "bg-emerald-100 text-emerald-700"
              : p.puntos === 1
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {p.puntos} pts
        </span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Sub-component: Tarjeta de jugador
// ─────────────────────────────────────────────
function JugadorCard({ jugador }: { jugador: JugadorAuditoria }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header de la tarjeta */}
      <button
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            {jugador.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{jugador.nombre}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-semibold tabular-nums text-slate-600">{jugador.total}</span> pronósticos ·{" "}
              {jugador.fechaRegistro
                ? new Date(jugador.fechaRegistro).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              descargarCsvJugador(jugador);
            }}
            title="Descargar CSV"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
          >
            ⬇ CSV
          </button>
          <span
            className={`text-slate-400 text-xs transition-transform duration-200 ${expandido ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Tabla de pronósticos expandida */}
      {expandido && (
        <div className="border-t border-slate-100">
          {jugador.pronosticos.length === 0 ? (
            <p className="text-sm text-slate-400 px-5 py-4">Sin pronósticos cargados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Partido</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Fase</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-center">Pronóstico</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-center">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {jugador.pronosticos.map((p) => (
                    <PronosticoRow key={p.partidoId} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab: AUDITORÍA
// ─────────────────────────────────────────────
function TabAuditoria({ clave }: { clave: string }) {
  const [datos, setDatos] = useState<AuditoriaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/predictions", {
          headers: { "x-admin-clave": clave },
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Error al cargar datos de auditoría");
        } else {
          const d: AuditoriaResponse = await res.json();
          setDatos(d);
        }
      } catch {
        setError("Error de red al cargar auditoría");
      }
      setLoading(false);
    }
    cargar();
  }, [clave]);

  return (
    <div className="space-y-4">
      {/* Encabezado informativo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-600 text-sm">🔒</span>
          <p className="text-xs text-amber-700 font-medium">
            Vista de solo lectura para auditoría y evidencia.
          </p>
        </div>
        {datos && datos.jugadores.length > 0 && (
          <button
            onClick={() => descargarCsvTodos(datos.jugadores)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            ⬇ Descargar todo (CSV)
          </button>
        )}
      </div>

      {/* Resumen */}
      {datos && (
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-sm text-slate-500">
            <span className="font-bold text-slate-800 tabular-nums">{datos.jugadores.length}</span> participantes ·{" "}
            <span className="font-bold text-slate-800 tabular-nums">
              {datos.jugadores.reduce((acc, j) => acc + j.total, 0)}
            </span>{" "}
            pronósticos en total
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setDatos(null);
              fetch("/api/admin/predictions", { headers: { "x-admin-clave": clave } })
                .then((r) => r.json())
                .then((d) => { setDatos(d); setLoading(false); })
                .catch(() => { setError("Error al actualizar"); setLoading(false); });
            }}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium"
          >
            ↻ Actualizar
          </button>
        </div>
      )}

      {/* Estado de carga / error */}
      {loading && (
        <div className="text-center py-12 text-slate-400">Cargando auditoría...</div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Lista de jugadores */}
      {!loading && !error && datos && (
        datos.jugadores.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay participantes registrados.</div>
        ) : (
          <div className="space-y-3">
            {datos.jugadores.map((j) => (
              <JugadorCard key={j.id} jugador={j} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Admin Page
// ─────────────────────────────────────────────
export default function Admin() {
  const [clave, setClave] = useState("");
  const [auth, setAuth] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>("partidos");
  const [graciaAbierta, setGraciaAbierta] = useState(false);
  const [graciaLoading, setGraciaLoading] = useState(false);

  async function login() {
    if (!clave.trim()) return;
    setLoggingIn(true);
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    setLoggingIn(false);
    if (res.ok) {
      setAuth(true);
      // Cargar estado del período de gracia al autenticarse
      fetch("/api/admin/grace", { headers: { "x-admin-clave": clave } })
        .then((r) => r.json())
        .then((d) => setGraciaAbierta(d.graciaAbierta ?? false))
        .catch(() => {});
    } else {
      setLoginError("Clave incorrecta. Intentá de nuevo.");
    }
  }

  async function toggleGracia() {
    setGraciaLoading(true);
    const nuevo = !graciaAbierta;
    const res = await fetch("/api/admin/grace", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify({ graciaAbierta: nuevo }),
    });
    if (res.ok) setGraciaAbierta(nuevo);
    setGraciaLoading(false);
  }

  // ── LOGIN FORM ──
  if (!auth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo/Header */}
          <div
            className="rounded-2xl p-6 text-white text-center mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9)" }}
          >
            <div className="text-3xl mb-2">⚽</div>
            <h1 className="text-xl font-bold tracking-tight">Panel Admin</h1>
            <p className="text-indigo-200 text-sm mt-1">Quiniela Mundial 2026</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Clave de acceso</label>
              <input
                type="password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loginError}</p>
            )}
            <button
              onClick={login}
              disabled={loggingIn || !clave.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              {loggingIn ? "Verificando..." : "Entrar"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── ADMIN PANEL ──
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "partidos", label: "Partidos", icon: "⚽" },
    { id: "eliminatorias", label: "Eliminatorias", icon: "🏆" },
    { id: "ranking", label: "Ranking", icon: "📊" },
    { id: "auditoria", label: "Auditoría", icon: "🧾" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="sticky top-0 z-30 shadow-md"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚽</span>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Panel Admin</h1>
              <p className="text-indigo-200 text-xs">Mundial 2026</p>
            </div>
          </div>
          <button
            onClick={() => { setAuth(false); setClave(""); }}
            className="text-indigo-200 hover:text-white text-xs font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
                tab === t.id
                  ? "bg-slate-50 text-slate-800"
                  : "text-indigo-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Banner período de gracia */}
      <div
        className={`border-b transition-colors ${
          graciaAbierta
            ? "bg-amber-50 border-amber-200"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{graciaAbierta ? "🔓" : "🔒"}</span>
            <div>
              <p className={`text-sm font-semibold ${graciaAbierta ? "text-amber-800" : "text-slate-600"}`}>
                Período de gracia:{" "}
                <span className={graciaAbierta ? "text-amber-600" : "text-slate-500"}>
                  {graciaAbierta ? "ABIERTO" : "CERRADO"}
                </span>
              </p>
              <p className={`text-xs ${graciaAbierta ? "text-amber-600" : "text-slate-400"}`}>
                {graciaAbierta
                  ? "Participantes pueden completar pronósticos faltantes (no modificar los existentes)"
                  : "Solo pronósticos antes del inicio de cada partido"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleGracia}
            disabled={graciaLoading}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              graciaAbierta
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-slate-600 hover:bg-slate-700 text-white"
            }`}
          >
            {graciaLoading ? "..." : graciaAbierta ? "Cerrar período" : "Abrir período de gracia"}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "partidos" && <TabPartidos clave={clave} />}
        {tab === "eliminatorias" && <TabEliminatorias clave={clave} />}
        {tab === "ranking" && <TabRanking />}
        {tab === "auditoria" && <TabAuditoria clave={clave} />}
      </main>
    </div>
  );
}
