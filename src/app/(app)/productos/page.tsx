"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt, calcMargen } from "@/lib/utils";
import type { Producto } from "@/types/database";
import Link from "next/link";
import Loading from "./loading";

export default function ProductosPage() {
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<Producto[]>([]);

  useEffect(() => {
    createClient()
      .from("productos")
      .select("*")
      .order("nombre")
      .then(({ data }) => {
        setLista((data as Producto[]) ?? []);
        setLoading(false);
      });
  }, []);

  const toggleActivo = useCallback(async (p: Producto, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.activo && !confirm(`¿Desactivar "${p.nombre}"? Ya no aparecerá en la canasta de ferias.`)) return;
    await createClient().from("productos").update({ activo: !p.activo }).eq("id", p.id);
    setLista((prev) => prev.map((item) => item.id === p.id ? { ...item, activo: !item.activo } : item));
  }, []);

  const activos = lista.filter((p) => p.activo);
  const inactivos = lista.filter((p) => !p.activo);
  const stockBajo = activos.filter((p) => p.stock_actual <= p.stock_minimo);

  if (loading) return <Loading />;

  const ProductCard = ({ p }: { p: Producto }) => {
    const isLow = p.stock_actual <= p.stock_minimo;
    const isOut = p.stock_actual === 0;
    return (
      <Link href={`/productos/${p.id}/editar`}>
        <div className={`bg-white rounded-2xl border p-4 ${isOut ? "border-red-300" : isLow ? "border-red-200" : "border-vs-border"}`}>
          <div className="flex gap-3 items-start">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>
              {p.foto_url ? (
                <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover rounded-xl" />
              ) : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-body font-bold text-vs-text text-sm leading-tight flex items-center gap-1">
                    {p.nombre}
                    {p.destacado && <span className="text-xs">⭐</span>}
                  </div>
                  {p.descripcion && (
                    <div className="font-body text-vs-muted text-xs mt-0.5 truncate">{p.descripcion}</div>
                  )}
                  {p.categoria && (
                    <span className="inline-block mt-1 bg-vs-greenPale text-vs-green font-body font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {p.categoria}
                    </span>
                  )}
                </div>
                <span className={`font-body font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                  isOut ? "bg-red-100 text-red-700" : isLow ? "bg-red-50 text-red-600" : "bg-vs-greenPale text-vs-green"
                }`}>
                  {isOut ? "Agotado" : `${p.stock_actual} u`}
                </span>
              </div>

              <div className="flex gap-4 mt-2">
                <div>
                  <div className="font-body text-vs-muted text-[10px]">Venta</div>
                  {p.precio_descuento != null ? (
                    <div className="flex items-center gap-1">
                      <span className="font-display font-black text-orange-500 text-sm">{fmt(p.precio_descuento)}</span>
                      <span className="font-body text-vs-muted text-[10px] line-through">{fmt(p.precio_venta)}</span>
                    </div>
                  ) : (
                    <div className="font-display font-black text-vs-green text-sm">{fmt(p.precio_venta)}</div>
                  )}
                </div>
                <div>
                  <div className="font-body text-vs-muted text-[10px]">Costo</div>
                  <div className="font-body font-bold text-vs-muted text-sm">{fmt(p.precio_costo)}</div>
                </div>
                <div>
                  <div className="font-body text-vs-muted text-[10px]">Margen</div>
                  <div className="font-body font-bold text-vs-accent text-sm">
                    {calcMargen(p.precio_descuento ?? p.precio_venta, p.precio_costo)}%
                  </div>
                </div>
              </div>

              {p.precio_descuento != null && (
                <span className="inline-block mt-1 bg-orange-100 text-orange-600 font-body font-bold text-[10px] px-2 py-0.5 rounded-full">
                  🏷️ En oferta
                </span>
              )}
              {isLow && !isOut && (
                <p className="font-body text-red-600 text-xs font-semibold mt-2">
                  ⚠ Stock bajo — mínimo: {p.stock_minimo} u
                </p>
              )}
              {p.fecha_venc && (
                <p className="font-body text-vs-muted text-xs mt-1">
                  Vence: {new Date(p.fecha_venc + "T00:00:00").toLocaleDateString("es-PE")}
                </p>
              )}

              <button
                onClick={(e) => toggleActivo(p, e)}
                className="mt-2 font-body text-vs-muted text-[10px] underline underline-offset-2 hover:text-red-500 transition-colors"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-black text-vs-text text-2xl">Productos</h1>
        <Link href="/productos/nuevo">
          <button className="bg-vs-green text-white font-body font-bold text-sm px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">
            + Agregar
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-vs-green text-xl">{activos.length}</div>
          <div className="font-body text-vs-muted text-xs">Activos</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-red-500 text-xl">{stockBajo.length}</div>
          <div className="font-body text-vs-muted text-xs">Stock bajo</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-vs-accent text-xl">
            {activos.reduce((a, p) => a + p.stock_actual, 0)}
          </div>
          <div className="font-body text-vs-muted text-xs">Unidades</div>
        </div>
      </div>

      {activos.length === 0 && inactivos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <div className="font-display font-bold text-vs-text text-lg">Sin productos aún</div>
          <p className="font-body text-vs-muted text-sm mt-2 mb-6">Agrega tu primer producto</p>
          <Link href="/productos/nuevo">
            <button className="bg-vs-green text-white font-body font-bold px-6 py-3 rounded-xl">+ Agregar producto</button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {activos.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      {inactivos.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-bold text-vs-muted text-base mb-3">
            Desactivados ({inactivos.length})
          </h2>
          <div className="space-y-2">
            {inactivos.map((p) => (
              <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover rounded-xl grayscale" />
                    ) : "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-bold text-vs-muted text-sm truncate">{p.nombre}</div>
                    <div className="font-body text-vs-muted text-xs">{fmt(p.precio_venta)} · {p.stock_actual} u</div>
                  </div>
                  <button
                    onClick={(e) => toggleActivo(p, e)}
                    className="flex-shrink-0 bg-vs-greenPale text-vs-green font-body font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-vs-green hover:text-white transition-colors"
                  >
                    Reactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
