"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/utils";
import type { Producto, ResumenFeria } from "@/types/database";
import { seedIfEmpty, getProductos, getResumenFerias } from "@/lib/demo/store";

export default function DemoReportesPage() {
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ferias, setFerias] = useState<ResumenFeria[]>([]);

  useEffect(() => {
    seedIfEmpty();
    setProductos(getProductos().filter((p) => p.activo));
    setFerias(getResumenFerias().filter((f) => f.estado === "finalizada"));
    setLoading(false);
  }, []);

  const totalIngresos = ferias.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = ferias.reduce((a, f) => a + Number(f.ganancia_neta), 0);
  const totalCosto = ferias.reduce((a, f) => a + Number(f.total_costo_productos), 0);
  const valorInventario = productos.reduce((a, p) => a + p.precio_costo * p.stock_actual, 0);
  const valorVentaPotencial = productos.reduce((a, p) => a + (p.precio_descuento ?? p.precio_venta) * p.stock_actual, 0);

  if (loading) return <div className="animate-pulse space-y-4 pt-4"><div className="h-7 w-24 bg-vs-border rounded-xl" /><div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-vs-border rounded-2xl" />)}</div></div>;

  return (
    <div>
      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Reportes</h1>

      <h2 className="font-display font-bold text-vs-text text-base mb-3">Ferias realizadas</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: "💰", label: "Ingresos totales", value: fmt(totalIngresos), color: "text-vs-green" },
          { icon: "📈", label: "Ganancia neta", value: fmt(totalGanancia), color: "text-green-600" },
          { icon: "🧾", label: "Costo productos", value: fmt(totalCosto), color: "text-vs-accent" },
          { icon: "🎪", label: "Ferias realizadas", value: String(ferias.length), color: "text-vs-text" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-vs-border rounded-2xl p-4">
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className={`font-display font-black text-xl ${card.color}`}>{card.value}</div>
            <div className="font-body text-vs-muted text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold text-vs-text text-base mb-3">Inventario actual</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-vs-border rounded-2xl p-4">
          <div className="text-2xl mb-1">📦</div>
          <div className="font-display font-black text-vs-green text-xl">{fmt(valorInventario)}</div>
          <div className="font-body text-vs-muted text-xs mt-1">Valor invertido en stock</div>
        </div>
        <div className="bg-white border border-vs-border rounded-2xl p-4">
          <div className="text-2xl mb-1">🏷️</div>
          <div className="font-display font-black text-vs-accent text-xl">{fmt(valorVentaPotencial)}</div>
          <div className="font-body text-vs-muted text-xs mt-1">Valor potencial de venta</div>
        </div>
      </div>

      {ferias.length > 0 && (
        <>
          <h2 className="font-display font-bold text-vs-text text-base mb-3">Detalle por feria</h2>
          <div className="space-y-3">
            {ferias.map((f) => {
              const neta = Number(f.ganancia_neta);
              return (
                <div key={f.id} className="bg-white border border-vs-border rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-body font-bold text-vs-text text-sm">{f.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">{f.ubicacion} · {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-PE")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-vs-green text-base">{fmt(Number(f.total_ingresos))}</div>
                      <div className={`font-body text-xs font-semibold ${neta >= 0 ? "text-green-500" : "text-red-500"}`}>Neto: {fmt(neta)}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs font-body text-vs-muted">
                    <span>Llevó: {f.total_llevado} u</span>
                    <span>Vendió: {f.total_vendido} u</span>
                    <span>Costo prod.: {fmt(Number(f.total_costo_productos))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {ferias.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-body text-vs-muted text-sm">Aún no hay ferias finalizadas.</div>
        </div>
      )}
    </div>
  );
}
