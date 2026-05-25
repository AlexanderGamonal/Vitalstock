import type { Producto, Feria, FeriaProducto, ResumenFeria } from "@/types/database";

const K = {
  productos: "demo_productos",
  ferias: "demo_ferias",
  fp: "demo_feria_productos",
  seeded: "demo_seeded",
};

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ─── Productos ────────────────────────────────────────────────────────────────

export function getProductos(): Producto[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(K.productos) ?? "[]");
}

function saveProductos(list: Producto[]) {
  localStorage.setItem(K.productos, JSON.stringify(list));
}

export function insertProducto(data: Omit<Producto, "id" | "created_at" | "updated_at">): Producto {
  const p: Producto = { ...data, id: uid(), created_at: now(), updated_at: now() };
  const list = getProductos();
  list.push(p);
  saveProductos(list);
  return p;
}

export function updateProducto(id: string, data: Partial<Producto>) {
  const list = getProductos().map((p) => p.id === id ? { ...p, ...data, updated_at: now() } : p);
  saveProductos(list);
}

// ─── Ferias ───────────────────────────────────────────────────────────────────

export function getFerias(): Feria[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(K.ferias) ?? "[]");
}

export function getFeria(id: string): Feria | null {
  return getFerias().find((f) => f.id === id) ?? null;
}

function saveFerias(list: Feria[]) {
  localStorage.setItem(K.ferias, JSON.stringify(list));
}

export function insertFeria(data: Omit<Feria, "id" | "created_at" | "updated_at">): Feria {
  const f: Feria = { ...data, id: uid(), created_at: now(), updated_at: now() };
  const list = getFerias();
  list.push(f);
  saveFerias(list);
  return f;
}

export function updateFeria(id: string, data: Partial<Feria>) {
  const list = getFerias().map((f) => f.id === id ? { ...f, ...data, updated_at: now() } : f);
  saveFerias(list);
}

export function deleteFeria(id: string) {
  saveFerias(getFerias().filter((f) => f.id !== id));
  saveFeriaProductos(getAllFeriaProductos().filter((fp) => fp.feria_id !== id));
}

// ─── Feria Productos ──────────────────────────────────────────────────────────

function getAllFeriaProductos(): FeriaProducto[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(K.fp) ?? "[]");
}

function saveFeriaProductos(list: FeriaProducto[]) {
  localStorage.setItem(K.fp, JSON.stringify(list));
}

export function getFeriaProductos(feriaId: string): (FeriaProducto & { producto: Producto })[] {
  const fps = getAllFeriaProductos().filter((fp) => fp.feria_id === feriaId);
  const productos = getProductos();
  return fps.map((fp) => ({ ...fp, producto: productos.find((p) => p.id === fp.producto_id)! }));
}

export function insertFeriaProductos(rows: Omit<FeriaProducto, "id" | "created_at" | "updated_at">[]) {
  const list = getAllFeriaProductos();
  rows.forEach((r) => list.push({ ...r, id: uid(), created_at: now(), updated_at: now() }));
  saveFeriaProductos(list);
}

export function updateFeriaProducto(id: string, data: Partial<FeriaProducto>) {
  saveFeriaProductos(getAllFeriaProductos().map((fp) => fp.id === id ? { ...fp, ...data, updated_at: now() } : fp));
}

export function deleteFeriaProducto(id: string) {
  saveFeriaProductos(getAllFeriaProductos().filter((fp) => fp.id !== id));
}

export function cerrarFeria(feriaId: string) {
  const fps = getAllFeriaProductos().filter((fp) => fp.feria_id === feriaId);
  const productos = getProductos();
  fps.forEach((fp) => {
    const p = productos.find((x) => x.id === fp.producto_id);
    if (p) updateProducto(p.id, { stock_actual: Math.max(0, p.stock_actual - fp.cantidad_vendida) });
  });
  updateFeria(feriaId, { estado: "finalizada" });
}

// ─── Resumen Ferias (equivalente a v_resumen_ferias) ─────────────────────────

export function getResumenFerias(): ResumenFeria[] {
  const ferias = getFerias().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const productos = getProductos();
  const fps = getAllFeriaProductos();
  return ferias.map((f) => {
    const items = fps.filter((fp) => fp.feria_id === f.id);
    const total_ingresos = items.reduce((a, fp) => a + fp.cantidad_vendida * (fp.precio_venta_feria ?? 0), 0);
    const total_costo = items.reduce((a, fp) => {
      const p = productos.find((x) => x.id === fp.producto_id);
      return a + fp.cantidad_vendida * (p?.precio_costo ?? 0);
    }, 0);
    return {
      ...f,
      total_ingresos,
      total_costo_productos: total_costo,
      ganancia_neta: total_ingresos - total_costo - (f.costo_inscripcion ?? 0) - (f.costo_transporte ?? 0),
      total_llevado: items.reduce((a, fp) => a + fp.cantidad_llevada, 0),
      total_vendido: items.reduce((a, fp) => a + fp.cantidad_vendida, 0),
    };
  });
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seeded)) return;

  const p1 = uid(), p2 = uid(), p3 = uid(), p4 = uid();
  const p5 = uid(), p6 = uid(), p7 = uid(), p8 = uid();
  const f1 = uid(), f2 = uid();

  const today = new Date();
  const próxima = new Date(today); próxima.setDate(today.getDate() + 14);
  const pasada = new Date(today); pasada.setDate(today.getDate() - 18);

  const productos: Producto[] = [
    { id: p1, nombre: "Crema hidratante facial", descripcion: "50ml, para todo tipo de piel", foto_url: null, precio_costo: 18, precio_venta: 45, precio_descuento: null, stock_actual: 15, stock_minimo: 3, categoria: "Cosméticos", fecha_venc: null, activo: true, destacado: true, created_at: now(), updated_at: now() },
    { id: p2, nombre: "Serum Vitamina C", descripcion: "30ml, iluminador y antioxidante", foto_url: null, precio_costo: 25, precio_venta: 65, precio_descuento: null, stock_actual: 8, stock_minimo: 3, categoria: "Cosméticos", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
    { id: p3, nombre: "Jabón artesanal lavanda", descripcion: "100g, sin parabenos", foto_url: null, precio_costo: 4, precio_venta: 12, precio_descuento: null, stock_actual: 30, stock_minimo: 5, categoria: "Cuidado personal", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
    { id: p4, nombre: "Vela aromática sándalo", descripcion: "200g, 40 horas de duración", foto_url: null, precio_costo: 8, precio_venta: 25, precio_descuento: null, stock_actual: 20, stock_minimo: 5, categoria: "Hogar", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
    { id: p5, nombre: "Set de pulseras tejidas", descripcion: "Set x3, colores surtidos", foto_url: null, precio_costo: 8, precio_venta: 28, precio_descuento: null, stock_actual: 25, stock_minimo: 3, categoria: "Accesorios", fecha_venc: null, activo: true, destacado: true, created_at: now(), updated_at: now() },
    { id: p6, nombre: "Aceite esencial rosas", descripcion: "15ml, 100% puro", foto_url: null, precio_costo: 14, precio_venta: 35, precio_descuento: null, stock_actual: 2, stock_minimo: 3, categoria: "Bienestar", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
    { id: p7, nombre: "Tote bag bordado", descripcion: "Algodón 100%, diseño exclusivo", foto_url: null, precio_costo: 20, precio_venta: 55, precio_descuento: 45, stock_actual: 5, stock_minimo: 2, categoria: "Accesorios", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
    { id: p8, nombre: "Granola artesanal 300g", descripcion: "Avena, miel y frutos secos", foto_url: null, precio_costo: 7, precio_venta: 18, precio_descuento: null, stock_actual: 0, stock_minimo: 5, categoria: "Alimentos", fecha_venc: null, activo: true, destacado: false, created_at: now(), updated_at: now() },
  ];

  const ferias: Feria[] = [
    { id: f1, nombre: "Feria Navideña Miraflores", fecha: próxima.toISOString().split("T")[0], ubicacion: "Parque Kennedy", costo_inscripcion: 50, costo_transporte: 20, notas: "Llevar toldo y mesa plegable", estado: "proxima", created_at: now(), updated_at: now() },
    { id: f2, nombre: "Feria Barranco Artesanal", fecha: pasada.toISOString().split("T")[0], ubicacion: "Bajada de Baños", costo_inscripcion: 30, costo_transporte: 15, notas: null, estado: "finalizada", created_at: now(), updated_at: now() },
  ];

  const feriaProductos: FeriaProducto[] = [
    // Canasta feria próxima (f1)
    { id: uid(), feria_id: f1, producto_id: p1, cantidad_llevada: 5, cantidad_vendida: 0, precio_venta_feria: 45, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f1, producto_id: p2, cantidad_llevada: 3, cantidad_vendida: 0, precio_venta_feria: 65, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f1, producto_id: p5, cantidad_llevada: 8, cantidad_vendida: 0, precio_venta_feria: 28, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f1, producto_id: p7, cantidad_llevada: 3, cantidad_vendida: 0, precio_venta_feria: 45, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f1, producto_id: p4, cantidad_llevada: 6, cantidad_vendida: 0, precio_venta_feria: 25, created_at: now(), updated_at: now() },
    // Resultados feria pasada (f2)
    { id: uid(), feria_id: f2, producto_id: p1, cantidad_llevada: 6, cantidad_vendida: 5, precio_venta_feria: 45, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f2, producto_id: p3, cantidad_llevada: 15, cantidad_vendida: 12, precio_venta_feria: 12, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f2, producto_id: p4, cantidad_llevada: 8, cantidad_vendida: 7, precio_venta_feria: 25, created_at: now(), updated_at: now() },
    { id: uid(), feria_id: f2, producto_id: p5, cantidad_llevada: 12, cantidad_vendida: 10, precio_venta_feria: 28, created_at: now(), updated_at: now() },
  ];

  localStorage.setItem(K.productos, JSON.stringify(productos));
  localStorage.setItem(K.ferias, JSON.stringify(ferias));
  localStorage.setItem(K.fp, JSON.stringify(feriaProductos));
  localStorage.setItem(K.seeded, "1");
}

export function resetDemo() {
  [K.productos, K.ferias, K.fp, K.seeded].forEach((k) => localStorage.removeItem(k));
}
