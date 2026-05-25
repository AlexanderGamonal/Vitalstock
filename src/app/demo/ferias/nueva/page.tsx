"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { insertFeria } from "@/lib/demo/store";

export default function DemoNuevaFeria() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", fecha: "", ubicacion: "", costo_inscripcion: "0", costo_transporte: "0", notas: "" });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.nombre || !form.fecha) { setError("Nombre y fecha son obligatorios"); return; }
    const f = insertFeria({ nombre: form.nombre.trim(), fecha: form.fecha, ubicacion: form.ubicacion.trim() || null, costo_inscripcion: parseFloat(form.costo_inscripcion) || 0, costo_transporte: parseFloat(form.costo_transporte) || 0, notas: form.notas.trim() || null, estado: "proxima" });
    router.push(`/demo/ferias/${f.id}`);
  };

  return (
    <div>
      <Link href="/demo/ferias"><button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">← Volver</button></Link>
      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Nueva Feria</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Nombre *</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="ej. Feria de Primavera" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Fecha *</label>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Ubicación</label>
            <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="ej. Parque Kennedy" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Costo inscripción</label>
            <input type="number" value={form.costo_inscripcion} onChange={(e) => setForm({ ...form, costo_inscripcion: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Costo transporte</label>
            <input type="number" value={form.costo_transporte} onChange={(e) => setForm({ ...form, costo_transporte: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Notas</label>
          <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} placeholder="Cualquier detalle adicional..." className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors resize-none" />
        </div>
      </div>

      <button onClick={handleSubmit} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all">Crear Feria ✓</button>
    </div>
  );
}
