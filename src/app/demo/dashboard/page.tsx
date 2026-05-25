"use client";

import { useEffect, useState } from "react";
import { fmt, calcMargen } from "@/lib/utils";
import type { Producto, ResumenFeria } from "@/types/database";
import Link from "next/link";
import { seedIfEmpty, getProductos, getResumenFerias } from "@/lib/demo/store";

export default function DemoDashboard() {
  const [loading, setLoading] = useState(true);
  const [stockBajo, setStockBajo] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ferias, setFerias] = useState<ResumenFeria[]>([]);

  useEffect(() => {
    seedIfEmpty();
    const ps = getProductos().filter((p) => p.activo);
    const fs = getResumenFerias();
    setStockBajo(ps.filter((p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0).slice(0, 5));
    const destacados = ps.filter((p) => p.destacado).slice(0, 3);
    setProductos(destacados.length > 0 ? destacados : ps.sort((a, b) => b.precio_venta - a.precio_venta).slice(0, 3));
    setFerias(fs.slice(0, 3));
    setLoading(false);
  }, []);

  const feriasDone = ferias.filter((f) => f.estado === "finalizada");
  const feriaProxima = ferias.find((f) => f.estado === "proxima");
  const totalIngresos = feriasDone.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = feriasDone.reduce((a, f) => a + Number(f.ganancia_neta), 0);

  if (loading) return <div className="animate-pulse space-y-4 pt-4"><div className="h-7 w-32 bg-vs-border rounded-xl" /><div className="grid grid-cols-2 gap-3"><div className="h-24 bg-vs-border rounded-2xl" /><div className="h-24 bg-vs-border rounded-2xl" /></div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-vs-text leading-tight">Hola 👋</h1>
        <p className="font-body text-vs-muted text-sm mt-1">
          {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {stockBajo.length > 0 && (
        <Link href="/demo/productos" className="block mb-5">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-body font-bold text-red-700 text-sm">
                {stockBajo.length} producto{stockBajo.length > 1 ? "s" : ""} con stock bajo
              </p>
              <p className="font-body text-red-600 text-xs mt-1">{stockBajo.map((p) => p.nombre).join(", ")}</p>
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
        <Link href={`/demo/ferias/${feriaProxima.id}`}>
          <div className="bg-vs-green text-white rounded-2xl p-4 mb-5">
            <div className="text-xs font-body opacity-75 mb-1">PRÓXIMA FERIA</div>
            <div className="font-display font-black text-lg leading-tight">{feriaProxima.nombre}</div>
            <div className="font-body text-sm opacity-85 mt-1">
              📍 {feriaProxima.ubicacion} · 📅{" "}
              {new Date(feriaProxima.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
            </div>
            <div className="mt-3 bg-white bg-opacity-20 rounded-xl px-3 py-2 inline-block">
              <span className="font-body font-bold text-sm">
                {feriaProxima.total_llevado > 0 ? "📝 Anotar lo vendido →" : "🎯 Armar canasta →"}
              </span>
            </div>
          </div>
        </Link>
      )}

      {feriasDone.length > 0 && (
        <>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Últimas ferias</h2>
          <div className="space-y-2 mb-6">
            {feriasDone.map((f) => (
              <Link key={f.id} href={`/demo/ferias/${f.id}`}>
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
                <Link key={p.id} href={`/demo/productos/${p.id}/editar`}>
                  <div className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3 hover:border-vs-green transition-colors">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>📦</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-vs-text text-sm truncate">{p.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">Margen: {fmt(p.precio_venta - p.precio_costo)} · {calcMargen(p.precio_venta, p.precio_costo)}%</div>
                    </div>
                    <span className={`font-body font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 ${isLow ? "bg-red-50 text-red-600" : "bg-vs-greenPale text-vs-green"}`}>
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
