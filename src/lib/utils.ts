export const fmt = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);

export const calcMargen = (venta: number, costo: number) =>
  venta > 0 ? (((venta - costo) / venta) * 100).toFixed(1) : "0";

export const fmtFecha = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const stockStatus = (actual: number, minimo: number) => {
  if (actual === 0) return "agotado";
  if (actual <= minimo) return "bajo";
  if (actual <= minimo * 1.5) return "medio";
  return "ok";
};

