"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { fmt } from "@/lib/utils";
import { convertToWebP } from "@/lib/imageUtils";
import Link from "next/link";
import Loading from "./loading";
const CATEGORIAS = ["Snacks", "Proteínas", "Infusiones", "Semillas", "Aceites", "Bebidas", "Suplementos", "Otro"];

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    nombre: "", descripcion: "", categoria: "",
    precio_costo: "", precio_venta: "", precio_descuento: "",
    stock_actual: "", stock_minimo: "", fecha_venc: "",
    destacado: false,
  });
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nombre: data.nombre ?? "",
            descripcion: data.descripcion ?? "",
            categoria: data.categoria ?? "",
            precio_costo: String(data.precio_costo ?? ""),
            precio_venta: String(data.precio_venta ?? ""),
            precio_descuento: data.precio_descuento != null ? String(data.precio_descuento) : "",
            stock_actual: String(data.stock_actual ?? ""),
            stock_minimo: String(data.stock_minimo ?? ""),
            fecha_venc: data.fecha_venc ?? "",
            destacado: data.destacado ?? false,
          });
          setFotoUrl(data.foto_url ?? null);
        }
        setLoading(false);
      });
  }, [id]);

  const pCosto = parseFloat(form.precio_costo) || 0;
  const pVenta = parseFloat(form.precio_venta) || 0;
  const pDescuento = form.precio_descuento ? parseFloat(form.precio_descuento) : null;
  const pEfectivo = pDescuento ?? pVenta;
  const margen = pEfectivo > 0 ? (((pEfectivo - pCosto) / pEfectivo) * 100).toFixed(1) : null;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.nombre || !form.precio_costo || !form.precio_venta || !form.stock_actual) {
      setError("Completa los campos obligatorios (*)");
      return;
    }
    setSaving(true);
    setError("");

    let foto_url = fotoUrl;

    if (foto) {
      // Borrar la foto anterior del bucket antes de subir la nueva
      if (fotoUrl) {
        const oldPath = fotoUrl.split("/vitalstock-productos/").pop();
        if (oldPath) {
          await supabase.storage.from("vitalstock-productos").remove([oldPath]);
        }
      }

      const webpFile = await convertToWebP(foto);
      const path = `productos/${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("vitalstock-productos")
        .upload(path, webpFile, { contentType: "image/webp" });
      if (!uploadError) {
        const { data } = supabase.storage.from("vitalstock-productos").getPublicUrl(path);
        foto_url = data.publicUrl;
      }
    }

    const { error: updateError } = await supabase
      .from("productos")
      .update({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        categoria: form.categoria || null,
        precio_costo: pCosto,
        precio_venta: pVenta,
        precio_descuento: pDescuento,
        stock_actual: parseInt(form.stock_actual),
        stock_minimo: parseInt(form.stock_minimo) || 5,
        destacado: form.destacado,
        fecha_venc: form.fecha_venc || null,
        foto_url,
      })
      .eq("id", id);

    if (updateError) {
      setError("Error al guardar: " + updateError.message);
      setSaving(false);
    } else {
      router.push("/productos");
      router.refresh();
    }
  };

  const handleDesactivar = async () => {
    if (!confirm("¿Desactivar este producto? Ya no aparecerá en la lista.")) return;
    await supabase.from("productos").update({ activo: false }).eq("id", id);
    router.push("/productos");
    router.refresh();
  };

  if (loading) return <Loading />;

  const currentPhoto = preview ?? fotoUrl;

  return (
    <div>
      <Link href="/productos">
        <button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">
          ← Volver
        </button>
      </Link>

      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Editar Producto</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">
          {error}
        </div>
      )}

      {/* Foto */}
      <label className="block mb-5 cursor-pointer">
        <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
        {currentPhoto ? (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden">
            <img src={currentPhoto} alt="foto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <span className="text-white font-body font-bold text-sm">Cambiar foto</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-vs-border rounded-2xl p-8 text-center bg-vs-greenPale hover:border-vs-green transition-colors">
            <div className="text-4xl mb-2">📷</div>
            <div className="font-body font-bold text-vs-green text-sm">Subir foto del producto</div>
            <div className="font-body text-vs-muted text-xs mt-1">JPG, PNG, HEIC — se convierte a WebP automáticamente</div>
          </div>
        )}
      </label>

      <div className="space-y-4">
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Nombre *</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="ej. Granola Artesanal"
            className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
          />
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="ej. Mix de avena, miel y frutos secos, 300g"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, categoria: cat })}
                className={`px-3 py-1.5 rounded-full font-body font-bold text-xs border transition-colors ${
                  form.categoria === cat
                    ? "bg-vs-green text-white border-vs-green"
                    : "bg-white text-vs-muted border-vs-border hover:border-vs-green"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Producto estrella</label>
          <button
            type="button"
            onClick={() => setForm({ ...form, destacado: !form.destacado })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-body font-bold text-sm transition-colors ${
              form.destacado
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-vs-border text-vs-muted"
            }`}
          >
            <span>{form.destacado ? "⭐" : "☆"}</span>
            {form.destacado ? "Marcado como estrella" : "Marcar como estrella"}
          </button>
          <p className="font-body text-vs-muted text-xs mt-1">Los productos estrella aparecen destacados en el inicio</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio costo *</label>
            <input
              type="number"
              value={form.precio_costo}
              onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio venta *</label>
            <input
              type="number"
              value={form.precio_venta}
              onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div className="col-span-2">
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">
              Precio de oferta <span className="text-vs-muted font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              value={form.precio_descuento}
              onChange={(e) => setForm({ ...form, precio_descuento: e.target.value })}
              placeholder="Dejar vacío si no hay descuento"
              className={`w-full px-4 py-3 rounded-xl border font-body text-sm text-vs-text bg-white outline-none transition-colors ${
                form.precio_descuento ? "border-orange-400 focus:border-orange-500" : "border-vs-border focus:border-vs-green"
              }`}
            />
            {pDescuento && pVenta > 0 && (
              <p className="font-body text-orange-600 text-xs mt-1 font-semibold">
                🏷️ Descuento activo: {Math.round(((pVenta - pDescuento) / pVenta) * 100)}% off
              </p>
            )}
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock actual *</label>
            <input
              type="number"
              value={form.stock_actual}
              onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock mínimo *</label>
            <input
              type="number"
              value={form.stock_minimo}
              onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
              placeholder="5"
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Fecha de vencimiento</label>
          <input
            type="date"
            value={form.fecha_venc}
            onChange={(e) => setForm({ ...form, fecha_venc: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
          />
        </div>
      </div>

      {margen && (
        <div className={`rounded-2xl p-4 mt-5 ${pDescuento ? "bg-orange-50" : "bg-vs-greenPale"}`}>
          <div className={`font-body font-bold text-sm ${pDescuento ? "text-orange-600" : "text-vs-green"}`}>
            {pDescuento ? "🏷️ Margen con precio de oferta" : "💡 Vista previa de margen"}
          </div>
          <div className={`font-display font-black text-2xl mt-1 ${pDescuento ? "text-orange-600" : "text-vs-green"}`}>
            {fmt(pEfectivo - pCosto)} por unidad
          </div>
          <div className="font-body text-vs-muted text-xs">
            {margen}% de margen
            {pDescuento && <span className="ml-2 line-through text-vs-muted">antes {fmt(pVenta - pCosto)}</span>}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios ✓"}
      </button>

      <button
        onClick={handleDesactivar}
        className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
      >
        Desactivar producto
      </button>
    </div>
  );
}
