"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/utils";
import Link from "next/link";
import { insertProducto } from "@/lib/demo/store";

const CATEGORIAS = ["Cosméticos", "Cuidado personal", "Accesorios", "Hogar", "Alimentos", "Ropa", "Bienestar", "Otro"];

export default function DemoNuevoProducto() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", descripcion: "", categoria: "", precio_costo: "", precio_venta: "", precio_descuento: "", stock_actual: "", stock_minimo: "5", fecha_venc: "", foto_url: "" });
  const [error, setError] = useState("");

  const pCosto = parseFloat(form.precio_costo) || 0;
  const pVenta = parseFloat(form.precio_venta) || 0;
  const margen = pVenta > 0 ? (((pVenta - pCosto) / pVenta) * 100).toFixed(1) : null;

  const handleSubmit = () => {
    if (!form.nombre || !form.precio_costo || !form.precio_venta || !form.stock_actual) {
      setError("Completa los campos obligatorios (*)"); return;
    }
    insertProducto({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria || null,
      precio_costo: pCosto,
      precio_venta: pVenta,
      precio_descuento: form.precio_descuento ? parseFloat(form.precio_descuento) : null,
      stock_actual: parseInt(form.stock_actual),
      stock_minimo: parseInt(form.stock_minimo) || 5,
      fecha_venc: form.fecha_venc || null,
      foto_url: form.foto_url.trim() || null,
      activo: true,
      destacado: false,
    });
    router.push("/demo/productos");
  };

  return (
    <div>
      <Link href="/demo/productos"><button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-5">← Volver</button></Link>
      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Nuevo Producto</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Nombre *</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="ej. Crema hidratante" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors resize-none" />
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">URL de imagen (opcional)</label>
          <input value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button key={cat} type="button" onClick={() => setForm({ ...form, categoria: cat })} className={`px-3 py-1.5 rounded-full font-body font-bold text-xs border transition-colors ${form.categoria === cat ? "bg-vs-green text-white border-vs-green" : "bg-white text-vs-muted border-vs-border hover:border-vs-green"}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio costo *</label>
            <input type="number" value={form.precio_costo} onChange={(e) => setForm({ ...form, precio_costo: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio venta *</label>
            <input type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div className="col-span-2">
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Precio de oferta <span className="text-vs-muted font-normal">(opcional)</span></label>
            <input type="number" value={form.precio_descuento} onChange={(e) => setForm({ ...form, precio_descuento: e.target.value })} placeholder="Dejar vacío si no hay descuento" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock inicial *</label>
            <input type="number" value={form.stock_actual} onChange={(e) => setForm({ ...form, stock_actual: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
          <div>
            <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Stock mínimo</label>
            <input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} placeholder="5" className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
          </div>
        </div>
        <div>
          <label className="block font-body font-bold text-vs-text text-sm mb-1.5">Fecha de vencimiento</label>
          <input type="date" value={form.fecha_venc} onChange={(e) => setForm({ ...form, fecha_venc: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors" />
        </div>
      </div>

      {margen && (
        <div className="bg-vs-greenPale rounded-2xl p-4 mt-5">
          <div className="font-body text-vs-green font-bold text-sm">💡 Vista previa de margen</div>
          <div className="font-display font-black text-vs-green text-2xl mt-1">{fmt(pVenta - pCosto)} por unidad</div>
          <div className="font-body text-vs-muted text-xs">{margen}% de margen</div>
        </div>
      )}

      <button onClick={handleSubmit} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl mt-6 hover:bg-opacity-90 transition-all">
        Guardar Producto ✓
      </button>
    </div>
  );
}
