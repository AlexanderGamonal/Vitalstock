"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/utils";
import type { Feria, FeriaProducto, Producto } from "@/types/database";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { seedIfEmpty, getFeria, getFeriaProductos, getProductos, insertFeriaProductos, updateFeriaProducto, deleteFeriaProducto, cerrarFeria } from "@/lib/demo/store";

export default function DemoFeriaDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [feria, setFeria] = useState<Feria | null>(null);
  const [items, setItems] = useState<(FeriaProducto & { producto: Producto })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [devoluciones, setDevoluciones] = useState<Record<string, number>>({});
  const [canasta, setCanasta] = useState<Record<string, number>>({});
  const [editandoCanasta, setEditandoCanasta] = useState(false);
  const [editItems, setEditItems] = useState<Record<string, { fpId: string; cantidad: number }>>({});
  const [nuevasAdiciones, setNuevasAdiciones] = useState<Record<string, number>>({});

  const load = () => {
    seedIfEmpty();
    const f = getFeria(id);
    const fp = getFeriaProductos(id);
    const ps = getProductos().filter((p) => p.activo && p.stock_actual > 0);
    setFeria(f);
    setItems(fp);
    setProductos(ps);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    if (Object.values(canasta).some((v) => v > 0)) localStorage.setItem(`demo_canasta_${id}`, JSON.stringify(canasta));
    else localStorage.removeItem(`demo_canasta_${id}`);
  }, [canasta, id]);

  const totalIngresos = items.reduce((a, i) => {
    const vendido = i.cantidad_llevada - (devoluciones[i.id] ?? 0);
    return a + vendido * (i.precio_venta_feria ?? 0);
  }, 0);
  const totalCostos = items.reduce((a, i) => {
    const vendido = i.cantidad_llevada - (devoluciones[i.id] ?? 0);
    return a + vendido * (i.producto?.precio_costo ?? 0);
  }, 0);
  const gastosFeria = (feria?.costo_inscripcion ?? 0) + (feria?.costo_transporte ?? 0);
  const gananciaNeta = totalIngresos - totalCostos - gastosFeria;

  const handleGuardarCanasta = () => {
    setSaving(true);
    const rows = Object.entries(canasta).filter(([, qty]) => qty > 0).map(([producto_id, cantidad_llevada]) => {
      const p = productos.find((pr) => pr.id === producto_id);
      return { feria_id: id, producto_id, cantidad_llevada, cantidad_vendida: 0, precio_venta_feria: p?.precio_descuento ?? p?.precio_venta ?? 0 };
    });
    insertFeriaProductos(rows);
    localStorage.removeItem(`demo_canasta_${id}`);
    setSaving(false);
    load();
  };

  const updateDevoluciones = (itemId: string, delta: number) => {
    setDevoluciones((prev) => {
      const item = items.find((i) => i.id === itemId)!;
      return { ...prev, [itemId]: Math.max(0, Math.min(item.cantidad_llevada, (prev[itemId] ?? 0) + delta)) };
    });
  };

  const handleCerrarFeria = () => {
    setSaving(true);
    items.forEach((item) => {
      const vendido = item.cantidad_llevada - (devoluciones[item.id] ?? 0);
      updateFeriaProducto(item.id, { cantidad_vendida: vendido });
    });
    cerrarFeria(id);
    router.push("/demo/ferias");
  };

  const entrarEditCanasta = () => {
    const initial: Record<string, { fpId: string; cantidad: number }> = {};
    items.forEach((i) => { initial[i.producto_id] = { fpId: i.id, cantidad: i.cantidad_llevada }; });
    setEditItems(initial);
    setNuevasAdiciones({});
    setEditandoCanasta(true);
  };

  const handleGuardarEditCanasta = () => {
    setSaving(true);
    Object.entries(editItems).forEach(([, { fpId, cantidad }]) => {
      const original = items.find((i) => i.id === fpId);
      if (cantidad === 0) deleteFeriaProducto(fpId);
      else if (original && original.cantidad_llevada !== cantidad) updateFeriaProducto(fpId, { cantidad_llevada: cantidad });
    });
    Object.entries(nuevasAdiciones).forEach(([productoId, cantidad]) => {
      if (cantidad > 0) {
        const p = productos.find((pr) => pr.id === productoId);
        insertFeriaProductos([{ feria_id: id, producto_id: productoId, cantidad_llevada: cantidad, cantidad_vendida: 0, precio_venta_feria: p?.precio_descuento ?? p?.precio_venta ?? 0 }]);
      }
    });
    setEditandoCanasta(false);
    setSaving(false);
    load();
  };

  if (loading) return <div className="text-center py-20 font-body text-vs-muted">Cargando...</div>;
  if (!feria) return <div className="text-center py-20 font-body text-vs-muted">Feria no encontrada</div>;

  const esProxima = feria.estado === "proxima";
  const esFinalizada = feria.estado === "finalizada";
  const productosEnCanasta = new Set(items.map((i) => i.producto_id));
  const productosDisponibles = productos.filter((p) => !productosEnCanasta.has(p.id));

  return (
    <div>
      <Link href="/demo/ferias"><button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-4">← Volver a Ferias</button></Link>

      {/* Header */}
      <div className="bg-vs-green text-white rounded-2xl p-5 mb-5 relative">
        <Link href={`/demo/ferias/${id}/editar`}>
          <button className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition-all flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </Link>
        <div className="text-xs font-body opacity-75 mb-1 uppercase tracking-wide">Feria</div>
        <div className="font-display font-black text-xl leading-tight">{feria.nombre}</div>
        <div className="font-body text-sm opacity-85 mt-1">📍 {feria.ubicacion} · 📅 {new Date(feria.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</div>
        {!esProxima && (
          <div className="flex gap-5 mt-4">
            <div><div className="text-[10px] opacity-70 uppercase">Ingresos</div><div className="font-display font-black text-xl">{fmt(totalIngresos)}</div></div>
            <div><div className="text-[10px] opacity-70 uppercase">Ganancia neta</div><div className={`font-display font-black text-xl ${gananciaNeta >= 0 ? "text-green-300" : "text-red-300"}`}>{fmt(gananciaNeta)}</div></div>
          </div>
        )}
      </div>

      {/* Armar canasta */}
      {esProxima && items.length === 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">🎯 Armar canasta</h2>
          <p className="font-body text-vs-muted text-sm mb-4">Indica cuántas unidades llevarás de cada producto.</p>
          <div className="space-y-3 mb-6">
            {productos.map((p) => (
              <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-body font-bold text-vs-text text-sm">{p.nombre}</div>
                  <div className="font-body text-vs-muted text-xs">Stock: {p.stock_actual} u · {fmt(p.precio_descuento ?? p.precio_venta)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCanasta((c) => ({ ...c, [p.id]: Math.max(0, (c[p.id] ?? 0) - 1) }))} className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors">−</button>
                  <span className="font-display font-black text-vs-green text-lg w-8 text-center">{canasta[p.id] ?? 0}</span>
                  <button onClick={() => setCanasta((c) => ({ ...c, [p.id]: Math.min(p.stock_actual, (c[p.id] ?? 0) + 1) }))} className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleGuardarCanasta} disabled={saving || Object.values(canasta).every((v) => v === 0)} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar canasta ✓"}
          </button>
        </div>
      )}

      {/* Registrar ventas */}
      {!esFinalizada && items.length > 0 && !editandoCanasta && (
        <>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Registro de ventas</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => {
              const devuelto = devoluciones[item.id] ?? 0;
              const llevado = item.cantidad_llevada;
              const vendido = llevado - devuelto;
              const pct = llevado > 0 ? (vendido / llevado) * 100 : 0;
              return (
                <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-body font-bold text-vs-text text-sm">{item.producto?.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">Llevé: {llevado} u</div>
                    </div>
                    <div className="font-display font-black text-vs-green text-base">{fmt(vendido * (item.precio_venta_feria ?? 0))}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-vs-muted text-xs font-semibold">Devuelvo:</span>
                    <button onClick={() => updateDevoluciones(item.id, -1)} className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors">−</button>
                    <span className="font-display font-black text-vs-green text-xl w-8 text-center">{devuelto}</span>
                    <button onClick={() => updateDevoluciones(item.id, 1)} className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors">+</button>
                    <div className="flex-1"><div className="bg-vs-border rounded-full h-1.5 overflow-hidden"><div className="bg-vs-green h-full rounded-full transition-all" style={{ width: `${pct}%` }} /></div></div>
                    <span className="font-body text-vs-muted text-xs">{Math.round(pct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-vs-greenPale rounded-2xl p-4 mb-4">
            <div className="flex justify-between font-body text-sm text-vs-green mb-2"><span>Gastos feria</span><span className="font-bold">−{fmt(gastosFeria)}</span></div>
            <div className="flex justify-between font-display font-black text-vs-green text-lg"><span>Ganancia neta</span><span>{fmt(gananciaNeta)}</span></div>
          </div>
          <button onClick={handleCerrarFeria} disabled={saving} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar y actualizar stock ✓"}
          </button>
          <button onClick={entrarEditCanasta} className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-vs-green border border-vs-border hover:border-vs-green transition-colors">✏️ Editar canasta</button>
        </>
      )}

      {/* Editar canasta */}
      {!esFinalizada && items.length > 0 && editandoCanasta && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">✏️ Editar canasta</h2>
          <div className="space-y-3 mb-5">
            {items.map((item) => {
              const edit = editItems[item.producto_id] ?? { fpId: item.id, cantidad: item.cantidad_llevada };
              if (edit.cantidad === 0) return null;
              return (
                <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0"><div className="font-body font-bold text-vs-text text-sm truncate">{item.producto?.nombre}</div><div className="font-body text-vs-muted text-xs">{fmt(item.precio_venta_feria ?? 0)} c/u</div></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditItems((prev) => ({ ...prev, [item.producto_id]: { fpId: item.id, cantidad: Math.max(0, (prev[item.producto_id]?.cantidad ?? item.cantidad_llevada) - 1) } }))} className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors">−</button>
                    <span className="font-display font-black text-vs-green text-lg w-8 text-center">{edit.cantidad}</span>
                    <button onClick={() => setEditItems((prev) => ({ ...prev, [item.producto_id]: { fpId: item.id, cantidad: (prev[item.producto_id]?.cantidad ?? item.cantidad_llevada) + 1 } }))} className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors">+</button>
                    <button onClick={() => setEditItems((prev) => ({ ...prev, [item.producto_id]: { fpId: item.id, cantidad: 0 } }))} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-base hover:bg-red-100 transition-colors">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
          {productosDisponibles.length > 0 && (
            <>
              <h3 className="font-display font-bold text-vs-text text-base mb-2">Agregar productos</h3>
              <div className="space-y-3 mb-5">
                {productosDisponibles.map((p) => (
                  <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0"><div className="font-body font-bold text-vs-text text-sm truncate">{p.nombre}</div><div className="font-body text-vs-muted text-xs">Stock: {p.stock_actual} u · {fmt(p.precio_descuento ?? p.precio_venta)}</div></div>
                    <div className="flex items-center gap-2">
                      {(nuevasAdiciones[p.id] ?? 0) > 0 && <><button onClick={() => setNuevasAdiciones((prev) => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 0) - 1) }))} className="w-8 h-8 rounded-full border border-vs-border font-body font-bold flex items-center justify-center hover:border-vs-green">−</button><span className="font-display font-black text-vs-green text-lg w-8 text-center">{nuevasAdiciones[p.id]}</span></>}
                      <button onClick={() => setNuevasAdiciones((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))} className="w-8 h-8 rounded-full bg-vs-greenPale text-vs-green font-body font-bold flex items-center justify-center hover:bg-vs-green hover:text-white transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <button onClick={handleGuardarEditCanasta} disabled={saving} className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-60">{saving ? "Guardando..." : "Guardar canasta ✓"}</button>
          <button onClick={() => setEditandoCanasta(false)} className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-vs-muted border border-vs-border hover:border-vs-green transition-colors">Cancelar</button>
        </div>
      )}

      {/* Resultados */}
      {esFinalizada && items.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Resultados</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <div><div className="font-body font-bold text-vs-text text-sm">{item.producto?.nombre}</div><div className="font-body text-vs-muted text-xs">{item.cantidad_vendida} / {item.cantidad_llevada} vendidos</div></div>
                  <div className="font-display font-black text-vs-green text-base">{fmt(item.cantidad_vendida * (item.precio_venta_feria ?? 0))}</div>
                </div>
                <div className="mt-2 bg-vs-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-vs-greenLight h-full rounded-full" style={{ width: `${item.cantidad_llevada > 0 ? (item.cantidad_vendida / item.cantidad_llevada) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
