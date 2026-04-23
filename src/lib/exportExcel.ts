import type { Producto, ResumenFeria } from "@/types/database";

export async function exportarReporteExcel(feriasList: ResumenFeria[], prodList: Producto[]) {
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

  const totalIngresos = feriasList.reduce((a, f) => a + Number(f.total_ingresos), 0);
  const totalGanancia = feriasList.reduce((a, f) => a + Number(f.ganancia_neta), 0);
  const totalFerias = feriasList.length;
  const margenPromedio = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : "0";
  const valorInventario = prodList.reduce((a, p) => a + p.stock_actual * p.precio_costo, 0);
  const valorVentaPotencial = prodList.reduce((a, p) => a + p.stock_actual * p.precio_venta, 0);

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
}
