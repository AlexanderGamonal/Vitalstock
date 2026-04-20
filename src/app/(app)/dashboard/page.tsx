"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt, calcMargen } from "@/lib/utils";
import type { Producto, ResumenFeria } from "@/types/database";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stockBajo, setStockBajo] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ferias, setFerias] = useState<ResumenFeria[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("v_stock_bajo").select("*").limit(5),
      supabase.from("productos").select("*").eq("activo", true).eq("destacado", true).limit(3),
      supabase.from("v_resumen_ferias").select("*").order("fecha", { ascending: false }).limit(3),
    ]).then(async ([{ data: sb }, { data: p }, { data: f }]) => {
      setStockBajo((sb as Producto[]) ?? []);
      setFerias((f as ResumenFeria[]) ?? []);
      const destacados = (p as Producto[]) ?? [];
      if (destacados.length > 0) {
        setProductos(destacados);
      } else {
        const { data: top } = await supabase
          .from("productos").select("*").eq("activo", true)
          .order("precio_venta", { ascending: false }).limit(3);
        setProductos((top as Producto[]) ?? []);
      }
      setLoading(false);
    });
  }, []);

  const feriasDone = ferias.filter((f) => f.estado === "finalizada");
  const feriaProxima = ferias.find((f) => f.estado === "proxima");
  const totalIngresos = feriasDone.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = feriasDone.reduce((a, f) => a + Number(f.ganancia_neta), 0);

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-vs-border rounded-xl mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-24 border border-vs-border" />
        ))}
      </div>
      <div className="h-28 bg-vs-border rounded-2xl mb-5" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-20" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-vs-text leading-tight">Hola 👋🌿</h1>
        <p className="font-body text-vs-muted text-sm mt-1">
          {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {stockBajo.length > 0 && (
        <Link href="/productos" className="block mb-5">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-body font-bold text-red-700 text-sm">
                {stockBajo.length} producto{stockBajo.length > 1 ? "s" : ""} con stock bajo
              </p>
              <p className="font-body text-red-600 text-xs mt-1">
                {stockBajo.map((p) => p.nombre).join(", ")}
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-vs-border rounded-2xl p-4">
          <div className="text-2xl mb-1">💰</div>
          <div className="font-display font-black text-vs-green text-xl">{fmt(totalIngresos)}</div>
          <div className="font-body text-vs-muted text-xs mt-1">Ingresos totales</div>
        </div>
        <div className="bg-white border border-vs-border rounded-2xl p-4">
          <div className="text-2xl mb-1">📈</div>
          <div className="font-display font-black text-vs-accent text-xl">{fmt(totalGanancia)}</div>
          <div className="font-body text-vs-muted text-xs mt-1">Ganancia neta</div>
        </div>
      </div>

      {feriaProxima && (
        <Link href={`/ferias/${feriaProxima.id}`}>
          <div className="bg-vs-green text-white rounded-2xl p-4 mb-5 relative overflow-hidden">
            <div className="text-xs font-body opacity-75 mb-1">PRÓXIMA FERIA</div>
            <div className="font-display font-black text-lg leading-tight">{feriaProxima.nombre}</div>
            <div className="font-body text-sm opacity-85 mt-1">
              📍 {feriaProxima.ubicacion} · 📅{" "}
              {new Date(feriaProxima.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
            </div>
            <div className="mt-3 bg-white bg-opacity-20 rounded-xl px-3 py-2 inline-block">
              <span className="font-body font-bold text-sm">Armar canasta →</span>
            </div>
          </div>
        </Link>
      )}

      {feriasDone.length > 0 && (
        <>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Últimas ferias</h2>
          <div className="space-y-2 mb-6">
            {feriasDone.map((f) => (
              <Link key={f.id} href={`/ferias/${f.id}`}>
                <div className="bg-white border border-vs-border rounded-2xl p-4 flex justify-between items-center hover:border-vs-green transition-colors">
                  <div>
                    <div className="font-body font-bold text-vs-text text-sm">{f.nombre}</div>
                    <div className="font-body text-vs-muted text-xs">{f.ubicacion} · {f.fecha}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-vs-green text-base">{fmt(Number(f.total_ingresos))}</div>
                    <div className="font-body text-xs text-green-500 font-semibold">+{fmt(Number(f.ganancia_neta))}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {productos.length > 0 && (
        <>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Productos estrella 🌟</h2>
          <div className="space-y-2">
            {productos.map((p) => {
              const isLow = p.stock_actual <= p.stock_minimo;
              return (
                <Link key={p.id} href={`/productos/${p.id}/editar`}>
                  <div className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3 hover:border-vs-green transition-colors">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover rounded-xl" />
                      ) : "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-vs-text text-sm truncate">{p.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">
                        Margen: {fmt(p.precio_venta - p.precio_costo)} · {calcMargen(p.precio_venta, p.precio_costo)}%
                      </div>
                    </div>
                    <span className={`font-body font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      isLow ? "bg-red-50 text-red-600" : "bg-vs-greenPale text-vs-green"
                    }`}>
                      {isLow ? `⚠ ${p.stock_actual}u` : `${p.stock_actual}u`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
