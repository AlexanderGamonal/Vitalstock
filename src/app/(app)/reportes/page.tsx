"use client";

import { useState, useEffect } from "react";
import type ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/utils";
import type { Producto, ResumenFeria } from "@/types/database";

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feriasList, setFeriasList] = useState<ResumenFeria[]>([]);
  const [prodList, setProdList] = useState<Producto[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("v_resumen_ferias").select("*").eq("estado", "finalizada").order("fecha", { ascending: false }),
      supabase.from("productos").select("*").eq("activo", true).order("precio_venta", { ascending: false }),
    ]).then(([{ data: f }, { data: p }]) => {
      setFeriasList((f as ResumenFeria[]) ?? []);
      setProdList((p as Producto[]) ?? []);
      setLoading(false);
    });
  }, []);

  const totalIngresos = feriasList.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = feriasList.reduce((a, f) => a + Number(f.ganancia_neta), 0);
  const totalFerias = feriasList.length;
  const margenPromedio = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : "0";
  const maxIngresos = Math.max(...feriasList.map((f) => Number(f.total_ingresos)), 1);
  const valorInventario = prodList.reduce((a, p) => a + p.stock_actual * p.precio_costo, 0);
  const valorVentaPotencial = prodList.reduce((a, p) => a + p.stock_actual * p.precio_venta, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      wb.creator = "VitalStock";
      wb.created = new Date();

      const GREEN = "FF52B788";
      const GREEN_PALE = "FFD8F3DC";
      const ROW_ALT = "FFF8FAFB";
      const RED_BG = "FFFEE2E2";
      const YELLOW_BG = "FFFFF3CD";

      const hStyle = (cell: ExcelJS.Cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          bottom: { style: "medium", color: { argb: GREEN } },
        };
      };

      const currency = '"S/ "#,##0.00';
      const fechaStr = new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

      // ── Sheet 1: Resumen ──────────────────────────────────────
      const ws1 = wb.addWorksheet("Resumen");
      ws1.columns = [{ width: 38 }, { width: 22 }];

      ws1.mergeCells("A1:B1");
      const titleCell = ws1.getCell("A1");
      titleCell.value = "VitalStock — Reporte de Inventario";
      titleCell.font = { bold: true, size: 15, color: { argb: GREEN } };
      titleCell.alignment = { horizontal: "left", vertical: "middle" };
      ws1.getRow(1).height = 28;

      ws1.getCell("A2").value = `Generado el ${fechaStr}`;
      ws1.getCell("A2").font = { size: 10, color: { argb: "FF6C757D" } };

      ws1.addRow([]);

      const kpiTitle = ws1.addRow(["INDICADORES CLAVE", ""]);
      kpiTitle.getCell(1).font = { bold: true, size: 11, color: { argb: "FF343A40" } };
      ws1.getRow(4).height = 20;

      const kpis: [string, number | string, string?][] = [
        ["Ingresos totales en ferias", totalIngresos, currency],
        ["Ganancia neta total", totalGanancia, currency],
        ["Ferias realizadas", totalFerias],
        ["Margen promedio", Number(margenPromedio) / 100, "0.0%"],
      ];
      kpis.forEach(([label, value, fmt]) => {
        const r = ws1.addRow([label, value]);
        r.getCell(1).font = { color: { argb: "FF6C757D" } };
        r.getCell(2).font = { bold: true, color: { argb: GREEN } };
        if (fmt) r.getCell(2).numFmt = fmt;
      });

      ws1.addRow([]);

      const invTitle = ws1.addRow(["VALOR DEL INVENTARIO ACTUAL", ""]);
      invTitle.getCell(1).font = { bold: true, size: 11, color: { argb: "FF343A40" } };

      const invRows: [string, number][] = [
        ["Capital invertido (precio de costo)", valorInventario],
        ["Valor a precio de venta", valorVentaPotencial],
        ["Ganancia potencial del inventario", valorVentaPotencial - valorInventario],
      ];
      invRows.forEach(([label, value]) => {
        const r = ws1.addRow([label, value]);
        r.getCell(1).font = { color: { argb: "FF6C757D" } };
        r.getCell(2).font = { bold: true, color: { argb: GREEN } };
        r.getCell(2).numFmt = currency;
      });

      // ── Sheet 2: Ferias ───────────────────────────────────────
      const ws2 = wb.addWorksheet("Ferias");
      ws2.columns = [
        { width: 26 }, { width: 12 }, { width: 20 },
        { width: 14 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 15 },
      ];

      const fHeaders = ["Nombre", "Fecha", "Ubicación", "Ingresos (S/)", "Costo Productos (S/)", "Inscripción (S/)", "Transporte (S/)", "Ganancia Neta (S/)"];
      const fHeaderRow = ws2.addRow(fHeaders);
      fHeaderRow.height = 22;
      fHeaderRow.eachCell(hStyle);

      feriasList.forEach((f, idx) => {
        const neta = Number(f.ganancia_neta);
        const row = ws2.addRow([
          f.nombre, f.fecha, f.ubicacion ?? "",
          Number(f.total_ingresos), Number(f.total_costo_productos),
          Number(f.costo_inscripcion), Number(f.costo_transporte), neta,
        ]);
        if (idx % 2 === 1) {
          row.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROW_ALT } }; });
        }
        [4, 5, 6, 7, 8].forEach((col) => { row.getCell(col).numFmt = currency; });
        row.getCell(8).font = { bold: true, color: { argb: neta >= 0 ? GREEN : "FFDC3545" } };
      });

      if (feriasList.length > 0) {
        const totRow = ws2.addRow(["TOTAL", "", "", totalIngresos, "", "", "", totalGanancia]);
        totRow.eachCell((c) => {
          c.font = { bold: true };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_PALE } };
        });
        totRow.getCell(4).numFmt = currency;
        totRow.getCell(8).numFmt = currency;
        totRow.getCell(8).font = { bold: true, color: { argb: totalGanancia >= 0 ? GREEN : "FFDC3545" } };
      }

      // ── Sheet 3: Productos ────────────────────────────────────
      const ws3 = wb.addWorksheet("Productos");
      ws3.columns = [
        { width: 5 }, { width: 28 }, { width: 14 },
        { width: 16 }, { width: 16 }, { width: 10 },
        { width: 13 }, { width: 12 }, { width: 18 }, { width: 12 },
      ];

      const pHeaders = ["#", "Nombre", "Categoría", "Precio Costo", "Precio Venta", "Margen %", "Stock Actual", "Stock Mín.", "Valor en Stock", "Estado"];
      const pHeaderRow = ws3.addRow(pHeaders);
      pHeaderRow.height = 22;
      pHeaderRow.eachCell(hStyle);

      const sorted = [...prodList].sort((a, b) => {
        const ma = a.precio_venta > 0 ? (a.precio_venta - a.precio_costo) / a.precio_venta : 0;
        const mb = b.precio_venta > 0 ? (b.precio_venta - b.precio_costo) / b.precio_venta : 0;
        return mb - ma;
      });

      sorted.forEach((p, i) => {
        const margen = p.precio_venta > 0 ? (p.precio_venta - p.precio_costo) / p.precio_venta : 0;
        const isOut = p.stock_actual === 0;
        const isLow = !isOut && p.stock_actual <= p.stock_minimo;
        const estado = isOut ? "Agotado" : isLow ? "Stock bajo" : "Normal";

        const row = ws3.addRow([
          i + 1, p.nombre, p.categoria ?? "",
          p.precio_costo, p.precio_venta, margen,
          p.stock_actual, p.stock_minimo, p.stock_actual * p.precio_costo, estado,
        ]);

        const bg = isOut ? RED_BG : isLow ? YELLOW_BG : i % 2 === 1 ? ROW_ALT : "FFFFFFFF";
        row.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }; });

        row.getCell(4).numFmt = currency;
        row.getCell(5).numFmt = currency;
        row.getCell(6).numFmt = "0.0%";
        row.getCell(9).numFmt = currency;
        row.getCell(6).font = { bold: true, color: { argb: GREEN } };
        if (isOut) row.getCell(10).font = { bold: true, color: { argb: "FFDC3545" } };
        if (isLow) row.getCell(10).font = { bold: true, color: { argb: "FFB45309" } };
      });

      // ── Download ──────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VitalStock_Reporte_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-7 w-28 bg-vs-border rounded-xl mb-5" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
      <div className="h-6 w-40 bg-vs-border rounded-xl mb-3" />
      <div className="bg-white rounded-2xl border border-vs-border h-48 mb-6" />
      <div className="h-6 w-48 bg-vs-border rounded-xl mb-3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-16" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-black text-vs-text text-2xl">Reportes</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-vs-green text-white font-body font-bold text-sm px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-60"
        >
          {exporting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </>
          )}
        </button>
      </div>

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

      {/* Inventario */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-vs-text text-lg mb-3">Valor del inventario</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-vs-border rounded-2xl p-4">
            <div className="text-2xl mb-1">🏷️</div>
            <div className="font-display font-black text-vs-accent text-xl">{fmt(valorInventario)}</div>
            <div className="font-body text-vs-muted text-xs mt-1">Capital invertido</div>
            <div className="font-body text-vs-muted text-[10px] mt-0.5">A precio de costo</div>
          </div>
          <div className="bg-white border border-vs-border rounded-2xl p-4">
            <div className="text-2xl mb-1">💎</div>
            <div className="font-display font-black text-vs-green text-xl">{fmt(valorVentaPotencial)}</div>
            <div className="font-body text-vs-muted text-xs mt-1">Venta potencial</div>
            <div className="font-body text-vs-muted text-[10px] mt-0.5">Si vendes todo el stock</div>
          </div>
        </div>
        {valorInventario > 0 && (
          <div className="bg-vs-greenPale rounded-xl px-4 py-2.5 mt-3 flex justify-between items-center">
            <span className="font-body text-vs-muted text-xs">Ganancia potencial del inventario</span>
            <span className="font-display font-black text-vs-green text-sm">{fmt(valorVentaPotencial - valorInventario)}</span>
          </div>
        )}
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
                      <div className="bg-vs-green h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
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
            {[...prodList]
              .sort((a, b) => (b.precio_venta - b.precio_costo) - (a.precio_venta - a.precio_costo))
              .map((p, i) => {
                const margen = p.precio_venta > 0
                  ? (((p.precio_venta - p.precio_costo) / p.precio_venta) * 100).toFixed(1)
                  : "0";
                const isLow = p.stock_actual <= p.stock_minimo;
                return (
                  <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="font-display font-black text-vs-muted text-lg w-6">#{i + 1}</div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>
                      {p.foto_url ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover rounded-xl" /> : "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-vs-text text-sm truncate">{p.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">{p.categoria}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-black text-vs-green text-sm">{fmt(p.precio_venta)}</div>
                      <div className="font-body font-bold text-vs-accent text-xs">{margen}%</div>
                    </div>
                    <span className={`font-body font-bold text-xs px-2 py-1 rounded-full ml-1 flex-shrink-0 ${
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

      {/* Desglose por feria */}
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

      {feriasList.length === 0 && prodList.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <div className="font-display font-bold text-vs-text text-lg">Sin datos aún</div>
          <p className="font-body text-vs-muted text-sm mt-2">Los reportes aparecerán cuando completes tu primera feria</p>
        </div>
      )}
    </div>
  );
}
