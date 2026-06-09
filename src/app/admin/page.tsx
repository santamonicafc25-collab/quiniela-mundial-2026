"use client";
import { useState } from "react";

export default function Admin() {
  const [clave, setClave] = useState("");
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ equipoLocal: "", equipoVisitante: "", fechaHora: "", fase: "grupos", jornada: 1 });
  const [resultado, setResultado] = useState({ partidoId: "", golesLocal: 0, golesVisitante: 0 });
  const [msg, setMsg] = useState("");

  async function login() {
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    setAuth(res.ok);
    setMsg(res.ok ? "" : "Clave incorrecta");
  }

  async function crearPartido() {
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify({ ...form, jornada: Number(form.jornada) }),
    });
    setMsg(res.ok ? "Partido creado" : "Error al crear");
  }

  async function cargarResultado() {
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-clave": clave },
      body: JSON.stringify({
        partidoId: resultado.partidoId,
        golesLocal: Number(resultado.golesLocal),
        golesVisitante: Number(resultado.golesVisitante),
      }),
    });
    setMsg(res.ok ? "Resultado cargado y puntos recalculados" : "Error");
  }

  if (!auth) {
    return (
      <main className="mx-auto max-w-sm p-6 space-y-3">
        <h1 className="text-xl font-bold">Admin</h1>
        <input type="password" className="w-full border rounded p-2" placeholder="Clave admin"
          value={clave} onChange={(e) => setClave(e.target.value)} />
        <button className="w-full bg-gray-800 text-white rounded p-2" onClick={login}>Entrar</button>
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6 space-y-6">
      <h1 className="text-xl font-bold">Panel de administración</h1>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Crear partido</h2>
        <input className="w-full border rounded p-2" placeholder="Equipo local"
          onChange={(e) => setForm({ ...form, equipoLocal: e.target.value })} />
        <input className="w-full border rounded p-2" placeholder="Equipo visitante"
          onChange={(e) => setForm({ ...form, equipoVisitante: e.target.value })} />
        <input type="datetime-local" className="w-full border rounded p-2"
          onChange={(e) => setForm({ ...form, fechaHora: e.target.value })} />
        <select className="w-full border rounded p-2" value={form.fase}
          onChange={(e) => setForm({ ...form, fase: e.target.value })}>
          <option value="grupos">Grupos</option>
          <option value="octavos">Octavos</option>
          <option value="cuartos">Cuartos</option>
          <option value="semis">Semis</option>
          <option value="tercer_puesto">Tercer puesto</option>
          <option value="final">Final</option>
        </select>
        <input type="number" className="w-full border rounded p-2" placeholder="Jornada" value={form.jornada}
          onChange={(e) => setForm({ ...form, jornada: Number(e.target.value) })} />
        <button className="w-full bg-blue-600 text-white rounded p-2" onClick={crearPartido}>Crear</button>
      </section>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Cargar resultado</h2>
        <input className="w-full border rounded p-2" placeholder="ID del partido"
          onChange={(e) => setResultado({ ...resultado, partidoId: e.target.value })} />
        <div className="flex gap-2">
          <input type="number" className="w-full border rounded p-2" placeholder="Goles local"
            onChange={(e) => setResultado({ ...resultado, golesLocal: Number(e.target.value) })} />
          <input type="number" className="w-full border rounded p-2" placeholder="Goles visitante"
            onChange={(e) => setResultado({ ...resultado, golesVisitante: Number(e.target.value) })} />
        </div>
        <button className="w-full bg-green-600 text-white rounded p-2" onClick={cargarResultado}>Cargar resultado</button>
      </section>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
