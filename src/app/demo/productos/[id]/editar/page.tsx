"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fmt } from "@/lib/utils";
import Link from "next/link";
import { getProductos, updateProducto } from "@/lib/demo/store";

const CATEGORIAS = ["Cosméticos", "Cuidado personal", "Accesorios", "Hogar", "Alimentos", "Ropa", "Bienestar", "Otro"];

export default function DemoEditarProducto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", descripcion: "", categoria: "", precio_costo: "", precio_venta: "", precio_descuento: "", stock_actual: "", stock_minimo: "", fecha_venc: "", foto_url: "", destacado: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = getProductos().find((x) => x.id === id);
    if (p) setForm({ nombre: p.nombre, descripcion: p.descripcion ?? "", categoria: p.categoria ?? "", precio_costo: String(p.precio_costo), precio_venta: String(p.precio_venta), precio_descuento: p.precio_descuento != null ? String(p.precio_descuento) : "", stock_actual: String(p.stock_actual), stock_minimo: String(p.stock_minimo), fecha_venc: p.fecha_venc ?? "", foto_url: p.foto_url ?? "", destacado: p.destacado });
    setLoading(false);
  }, [id]);

  const pCosto = parseFloat(form.precio_costo) || 0;
  const pVenta = parseFloat(form.precio_venta) || 0;
  const pDesc = form.precio_descuento ? parseFloat(form.precio_descuento) : null;
  const pEfectivo = pDesc ?? pVenta;
  const margen = pEfectivo > 0 ? (((pEfectivo - pCosto) / pEfectivo) * 100).toFixed(1) : null;

  const handleSave = () => {
    if (!form.nombre || !form.precio_costo || !form.precio_venta || !form.stock_actual) { setError("Completa los campos obligatorios (*)"); return; }
    updateProducto(id, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, categoria: form.categoria || null, precio_costo: pCosto, precio_venta: pVenta, precio_descuento: pDesc, stock_actual: parseInt(form.stock_actual), stock_minimo: parseInt(form.stock_minimo) || 5, destacado: form.destacado, fecha_venc: form.fecha_venc || null, foto_url: form.foto_url.trim() || null });
    router.push("/demo/productos");
  };

  const handleDesactivar = () => {
    if (!confirm("¿Desactivar este producto?")) return;
    updateProducto(id, { activo: false });
    router.push("/demo/productos");
  };

  if (loading) return null;

  return (
    <div>
      <Link href="/demo/productos"><button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">← Volver</button></Link>
      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Editar Producto</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Nombre *</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors resize-none" />
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">URL de imagen (opcional)</label>
          <input value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          {form.foto_url && <img src={form.foto_url} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" onError={(e) => (e.currentTarget.style.display = "none")} />}
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button key={cat} type="button" onClick={() => setForm({ ...form, categoria: cat })} className={`px-3 py-1.5 rounded-full font-body font-bold text-xs border transition-colors ${form.categoria === cat ? "bg-vs-green text-white border-vs-green" : "bg-white text-vs-muted border-vs-border hover:border-vs-green"}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Producto estrella</label>
          <button type="button" onClick={() => setForm({ ...form, destacado: !form.destacado })} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-body font-bold text-sm transition-colors ${form.destacado ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-vs-border text-vs-muted"}`}>
            <span>{form.destacado ? "⭐" : "☆"}</span>{form.destacado ? "Marcado como estrella" : "Marcar como estrella"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio costo *</label>
            <input type="number" value={form.precio_costo} onChange={(e) => setForm({ ...form, precio_costo: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio venta *</label>
            <input type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div className="col-span-2">
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio de oferta <span className="text-vs-muted font-normal">(opcional)</span></label>
            <input type="number" value={form.precio_descuento} onChange={(e) => setForm({ ...form, precio_descuento: e.target.value })} placeholder="Dejar vacío si no hay descuento" className={`w-full px-4 py-3 rounded-xl border font-body text-sm text-vs-text bg-white outline-none transition-colors ${form.precio_descuento ? "border-orange-400" : "border-vs-border focus:border-vs-green"}`} />
            {pDesc && pVenta > 0 && <p className="font-body text-orange-600 text-xs mt-1 font-semibold">🏷️ {Math.round(((pVenta - pDesc) / pVenta) * 100)}% de descuento activo</p>}
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock actual *</label>
            <input type="number" value={form.stock_actual} onChange={(e) => setForm({ ...form, stock_actual: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock mínimo</label>
            <input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Fecha de vencimiento</label>
          <input type="date" value={form.fecha_venc} onChange={(e) => setForm({ ...form, fecha_venc: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
      </div>

      {margen && (
        <div className={`rounded-2xl p-4 mt-5 ${pDesc ? "bg-orange-50" : "bg-vs-greenPale"}`}>
          <div className={`font-body font-bold text-sm ${pDesc ? "text-orange-600" : "text-vs-green"}`}>{pDesc ? "🏷️ Margen con precio de oferta" : "💡 Vista previa de margen"}</div>
          <div className={`font-display font-black text-2xl mt-1 ${pDesc ? "text-orange-600" : "text-vs-green"}`}>{fmt(pEfectivo - pCosto)} por unidad</div>
          <div className="font-body text-vs-muted text-xs">{margen}% de margen</div>
        </div>
      )}

      <button onClick={handleSave} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all">Guardar cambios ✓</button>
      <button onClick={handleDesactivar} className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors">Desactivar producto</button>
    </div>
  );
}
