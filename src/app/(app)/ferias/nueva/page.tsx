"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const emptyForm = {
  nombre: "", fecha: "", ubicacion: "",
  costo_inscripcion: "", costo_transporte: "", notas: "",
};

export default function NuevaFeriaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha) {
      setError("Nombre y fecha son obligatorios");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await supabase
      .from("ferias")
      .insert({
        nombre: form.nombre.trim(),
        fecha: form.fecha,
        ubicacion: form.ubicacion.trim() || null,
        costo_inscripcion: parseFloat(form.costo_inscripcion) || 0,
        costo_transporte: parseFloat(form.costo_transporte) || 0,
        notas: form.notas.trim() || null,
        estado: "proxima",
      });

    if (err) {
      setError("Error al guardar: " + err.message);
      setLoading(false);
    } else {
      setSavedName(form.nombre.trim());
      setForm(emptyForm);
      setLoading(false);
    }
  };

  const handleCrearOtra = () => {
    setSavedName(null);
  };

  const handleVerFerias = () => {
    router.push("/ferias");
    router.refresh();
  };

  return (
    <div>
      <Link href="/ferias">
        <button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">
          ← Volver
        </button>
      </Link>

      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Nueva Feria</h1>

      {/* Banner de éxito */}
      {savedName && (
        <div className="bg-vs-greenPale border border-vs-green rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <div className="font-display font-black text-vs-green text-base leading-tight">
                ¡Feria creada!
              </div>
              <div className="font-body text-vs-green text-sm mt-1 opacity-80">
                &ldquo;{savedName}&rdquo; fue registrada correctamente.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleCrearOtra}
              className="bg-white border border-vs-green text-vs-green font-body font-bold text-sm py-3 rounded-xl hover:bg-vs-greenPale transition-colors"
            >
              + Crear otra
            </button>
            <button
              onClick={handleVerFerias}
              className="bg-vs-green text-white font-body font-bold text-sm py-3 rounded-xl hover:bg-opacity-90 transition-all"
            >
              Ver ferias →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Nombre *</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="ej. Feria Corporativa Tech"
            className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Fecha *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Ubicación</label>
            <input
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="ej. Las Condes"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Costo inscripción</label>
            <input
              type="number"
              value={form.costo_inscripcion}
              onChange={(e) => setForm({ ...form, costo_inscripcion: e.target.value })}
              placeholder="$0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Costo transporte</label>
            <input
              type="number"
              value={form.costo_transporte}
              onChange={(e) => setForm({ ...form, costo_transporte: e.target.value })}
              placeholder="$0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Cualquier detalle adicional..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Crear Feria ✓"}
      </button>
    </div>
  );
}
