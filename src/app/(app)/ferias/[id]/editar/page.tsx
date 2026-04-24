"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const ESTADOS = [
  { value: "proxima", label: "Próxima" },
  { value: "en_curso", label: "En curso" },
  { value: "finalizada", label: "Finalizada" },
];

export default function EditarFeriaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    nombre: "", fecha: "", ubicacion: "",
    costo_inscripcion: "", costo_transporte: "",
    notas: "", estado: "proxima",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [esProxima, setEsProxima] = useState(false);

  useEffect(() => {
    supabase.from("ferias").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setForm({
          nombre: data.nombre ?? "",
          fecha: data.fecha ?? "",
          ubicacion: data.ubicacion ?? "",
          costo_inscripcion: String(data.costo_inscripcion ?? "0"),
          costo_transporte: String(data.costo_transporte ?? "0"),
          notas: data.notas ?? "",
          estado: data.estado ?? "proxima",
        });
        setEsProxima(data.estado === "proxima");
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!form.nombre || !form.fecha) {
      setError("Nombre y fecha son obligatorios");
      return;
    }
    setSaving(true);
    setError("");

    const { error: err } = await supabase.from("ferias").update({
      nombre: form.nombre.trim(),
      fecha: form.fecha,
      ubicacion: form.ubicacion.trim() || null,
      costo_inscripcion: parseFloat(form.costo_inscripcion) || 0,
      costo_transporte: parseFloat(form.costo_transporte) || 0,
      notas: form.notas.trim() || null,
      estado: form.estado,
    }).eq("id", id);

    if (err) {
      setError("Error al guardar: " + err.message);
      setSaving(false);
    } else {
      router.push(`/ferias/${id}`);
      router.refresh();
    }
  };

  const handleEliminar = async () => {
    if (!confirm("¿Eliminar esta feria? Esta acción no se puede deshacer.")) return;
    await supabase.from("ferias").delete().eq("id", id);
    router.push("/ferias");
    router.refresh();
  };

  if (loading) return null;

  return (
    <div>
      <Link href={`/ferias/${id}`}>
        <button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">
          ← Volver
        </button>
      </Link>

      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Editar Feria</h1>

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
              placeholder="ej. Miraflores"
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
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Costo transporte</label>
            <input
              type="number"
              value={form.costo_transporte}
              onChange={(e) => setForm({ ...form, costo_transporte: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Estado</label>
          <div className="flex gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setForm({ ...form, estado: e.value })}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs border transition-colors ${
                  form.estado === e.value
                    ? "bg-vs-green text-white border-vs-green"
                    : "bg-white text-vs-muted border-vs-border hover:border-vs-green"
                }`}
              >
                {e.label}
              </button>
            ))}
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
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios ✓"}
      </button>

      {esProxima && (
        <button
          onClick={handleEliminar}
          className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
        >
          Eliminar feria
        </button>
      )}
    </div>
  );
}
