"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt, calcMargen } from "@/lib/utils";
import type { Producto } from "@/types/database";
import Link from "next/link";

export default function ProductosPage() {
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<Producto[]>([]);

  useEffect(() => {
    createClient()
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => {
        setLista((data as Producto[]) ?? []);
        setLoading(false);
      });
  }, []);

  const stockBajo = lista.filter((p) => p.stock_actual <= p.stock_minimo);

  if (loading) return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-5">
        <div className="h-7 w-28 bg-vs-border rounded-xl" />
        <div className="h-9 w-24 bg-vs-border rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-vs-border h-16" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
    </div>
  );

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
          <div className="font-display font-black text-vs-green text-xl">{lista.length}</div>
          <div className="font-body text-vs-muted text-xs">Total</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-red-500 text-xl">{stockBajo.length}</div>
          <div className="font-body text-vs-muted text-xs">Stock bajo</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-vs-accent text-xl">
            {lista.reduce((a, p) => a + p.stock_actual, 0)}
          </div>
          <div className="font-body text-vs-muted text-xs">Unidades</div>
        </div>
      </div>

      <div className="space-y-3">
        {lista.map((p) => {
          const isLow = p.stock_actual <= p.stock_minimo;
          const isOut = p.stock_actual === 0;
          return (
            <Link key={p.id} href={`/productos/${p.id}/editar`}>
            <div
              className={`bg-white rounded-2xl border p-4 ${
                isOut ? "border-red-300" : isLow ? "border-red-200" : "border-vs-border"
              }`}
            >
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
                      <div className="font-display font-black text-vs-green text-sm">{fmt(p.precio_venta)}</div>
                    </div>
                    <div>
                      <div className="font-body text-vs-muted text-[10px]">Costo</div>
                      <div className="font-body font-bold text-vs-muted text-sm">{fmt(p.precio_costo)}</div>
                    </div>
                    <div>
                      <div className="font-body text-vs-muted text-[10px]">Margen</div>
                      <div className="font-body font-bold text-vs-accent text-sm">{calcMargen(p.precio_venta, p.precio_costo)}%</div>
                    </div>
                  </div>

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
                </div>
              </div>
            </div>
            </Link>
          );
        })}

        {lista.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <div className="font-display font-bold text-vs-text text-lg">Sin productos aún</div>
            <p className="font-body text-vs-muted text-sm mt-2 mb-6">Agrega tu primer producto saludable</p>
            <Link href="/productos/nuevo">
              <button className="bg-vs-green text-white font-body font-bold px-6 py-3 rounded-xl">
                + Agregar producto
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
