export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/utils";
import type { Producto, ResumenFeria } from "@/types/database";

export default async function ReportesPage() {
  const supabase = await createClient();

  const [{ data: ferias }, { data: productos }] = await Promise.all([
    supabase.from("v_resumen_ferias").select("*").eq("estado", "finalizada").order("fecha", { ascending: false }),
    supabase.from("productos").select("*").eq("activo", true).order("precio_venta", { ascending: false }),
  ]);

  const feriasList = (ferias as ResumenFeria[]) ?? [];
  const prodList = (productos as Producto[]) ?? [];

  const totalIngresos = feriasList.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = feriasList.reduce((a, f) => a + Number(f.ganancia_neta), 0);
  const totalFerias = feriasList.length;
  const margenPromedio = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : "0";

  const maxIngresos = Math.max(...feriasList.map((f) => Number(f.total_ingresos)), 1);

  return (
    <div>
      <h1 className="font-display font-black text-vs-text text-2xl mb-5">Reportes</h1>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: "💰", label: "Ingresos totales", value: fmt(totalIngresos), color: "text-vs-green" },
          { icon: "📈", label: "Ganancia neta", value: fmt(totalGanancia), color: "text-vs-accent" },
          { icon: "🎪", label: "Ferias realizadas", value: String(totalFerias), color: "text-vs-green" },
          { icon: "📊", label: "Margen promedio", value: `${margenPromedio}%`, color: "text-vs-greenLight" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-vs-border rounded-2xl p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`font-display font-black text-xl ${stat.color}`}>{stat.value}</div>
            <div className="font-body text-vs-muted text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Comparativa ferias */}
      {feriasList.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Ingresos por feria</h2>
          <div className="bg-white border border-vs-border rounded-2xl p-4">
            <div className="space-y-3">
              {feriasList.map((f) => {
                const pct = (Number(f.total_ingresos) / maxIngresos) * 100;
                const neta = Number(f.ganancia_neta);
                return (
                  <div key={f.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <div className="font-body font-bold text-vs-text text-sm">{f.nombre}</div>
                        <div className="font-body text-vs-muted text-xs">{f.fecha} · {f.ubicacion}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-vs-green text-sm">{fmt(Number(f.total_ingresos))}</div>
                        <div className={`font-body text-xs font-semibold ${neta >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {neta >= 0 ? "+" : ""}{fmt(neta)}
                        </div>
                      </div>
                    </div>
                    <div className="bg-vs-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-vs-green h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Productos por margen */}
      {prodList.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Productos por margen</h2>
          <div className="space-y-2">
            {prodList
              .sort((a, b) => (b.precio_venta - b.precio_costo) - (a.precio_venta - a.precio_costo))
              .map((p, i) => {
                const margen = p.precio_venta > 0
                  ? (((p.precio_venta - p.precio_costo) / p.precio_venta) * 100).toFixed(1)
                  : "0";
                const isLow = p.stock_actual <= p.stock_minimo;
                return (
                  <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="font-display font-black text-vs-muted text-lg w-6">#{i + 1}</div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>
                      📦
                    </div>
                    <div className="flex-1">
                      <div className="font-body font-bold text-vs-text text-sm">{p.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">{p.categoria}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-vs-green text-sm">{fmt(p.precio_venta)}</div>
                      <div className="font-body font-bold text-vs-accent text-xs">{margen}%</div>
                    </div>
                    <span className={`font-body font-bold text-xs px-2 py-1 rounded-full ml-1 ${
                      isLow ? "bg-red-50 text-red-600" : "bg-vs-greenPale text-vs-green"
                    }`}>
                      {p.stock_actual}u
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Detalle gastos por feria */}
      {feriasList.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Desglose de costos</h2>
          <div className="space-y-2">
            {feriasList.map((f) => (
              <div key={f.id} className="bg-white border border-vs-border rounded-2xl p-4">
                <div className="font-body font-bold text-vs-text text-sm mb-2">{f.nombre}</div>
                <div className="space-y-1">
                  {[
                    { label: "Ingresos", value: Number(f.total_ingresos), positive: true },
                    { label: "Costo productos", value: -Number(f.total_costo_productos), positive: false },
                    { label: "Inscripción", value: -Number(f.costo_inscripcion), positive: false },
                    { label: "Transporte", value: -Number(f.costo_transporte), positive: false },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between font-body text-xs">
                      <span className="text-vs-muted">{row.label}</span>
                      <span className={row.positive ? "text-vs-green font-semibold" : "text-vs-muted"}>
                        {row.positive ? "" : "−"}{fmt(Math.abs(row.value))}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-vs-border pt-1 flex justify-between font-body font-bold text-sm">
                    <span className="text-vs-text">Ganancia neta</span>
                    <span className={Number(f.ganancia_neta) >= 0 ? "text-vs-green" : "text-red-600"}>
                      {fmt(Number(f.ganancia_neta))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feriasList.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <div className="font-display font-bold text-vs-text text-lg">Sin datos aún</div>
          <p className="font-body text-vs-muted text-sm mt-2">Los reportes aparecerán cuando completes tu primera feria</p>
        </div>
      )}
    </div>
  );
}
