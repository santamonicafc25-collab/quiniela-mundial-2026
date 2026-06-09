"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function entrar() {
    setError("");
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, nombre, pin }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    localStorage.setItem("jugadorId", data.jugadorId);
    localStorage.setItem("nombre", data.nombre);
    router.push("/jugar");
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Quiniela Mundial 2026</h1>
      <input className="w-full border rounded p-2" placeholder="Código de sala"
        value={codigo} onChange={(e) => setCodigo(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Tu nombre"
        value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="PIN (4 dígitos)" inputMode="numeric"
        maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="w-full bg-blue-600 text-white rounded p-2" onClick={entrar}>
        Entrar
      </button>
    </main>
  );
}
