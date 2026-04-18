"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/utils";
import type { Feria, FeriaProducto, Producto } from "@/types/database";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function FeriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const router = useRouter();

  const [feria, setFeria] = useState<Feria | null>(null);
  const [items, setItems] = useState<(FeriaProducto & { producto: Producto })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"view" | "armar" | "registrar">("view");

  // Para armar canasta
  const [canasta, setCanasta] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const [{ data: f }, { data: fp }, { data: p }] = await Promise.all([
        supabase.from("ferias").select("*").eq("id", id).single(),
        supabase.from("feria_productos").select("*, producto:productos(*)").eq("feria_id", id),
        supabase.from("productos").select("*").eq("activo", true).order("nombre"),
      ]);
      setFeria(f as Feria);
      setItems((fp ?? []) as (FeriaProducto & { producto: Producto })[]);
      setProductos((p ?? []) as Producto[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const totalIngresos = items.reduce(
    (a, i) => a + i.cantidad_vendida * (i.precio_venta_feria ?? i.producto?.precio_venta ?? 0), 0
  );
  const totalCostos = items.reduce(
    (a, i) => a + i.cantidad_vendida * (i.producto?.precio_costo ?? 0), 0
  );
  const gastosFeria = (feria?.costo_inscripcion ?? 0) + (feria?.costo_transporte ?? 0);
  const gananciaNeta = totalIngresos - totalCostos - gastosFeria;

  // Guardar canasta
  const handleGuardarCanasta = async () => {
    setSaving(true);
    const rows = Object.entries(canasta)
      .filter(([, qty]) => qty > 0)
      .map(([producto_id, cantidad_llevada]) => {
        const p = productos.find((pr) => pr.id === producto_id);
        return {
          feria_id: id,
          producto_id,
          cantidad_llevada,
          cantidad_vendida: 0,
          precio_venta_feria: p?.precio_venta ?? 0,
        };
      });

    await supabase.from("feria_productos").insert(rows);
    router.refresh();
    window.location.reload();
  };

  // Actualizar ventas
  const updateVendidos = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, cantidad_vendida: Math.max(0, Math.min(i.cantidad_llevada, i.cantidad_vendida + delta)) }
          : i
      )
    );
  };

  // Guardar ventas y cerrar feria
  const handleCerrarFeria = async () => {
    setSaving(true);
    for (const item of items) {
      await supabase
        .from("feria_productos")
        .update({ cantidad_vendida: item.cantidad_vendida })
        .eq("id", item.id);
    }
    await supabase.rpc("cerrar_feria", { p_feria_id: id });
    router.push("/ferias");
    router.refresh();
  };

  if (loading) {
    return <div className="text-center py-20 font-body text-vs-muted">Cargando...</div>;
  }

  if (!feria) {
    return <div className="text-center py-20 font-body text-vs-muted">Feria no encontrada</div>;
  }

  const esProxima = feria.estado === "proxima";
  const esFinalizada = feria.estado === "finalizada";

  return (
    <div>
      <Link href="/ferias">
        <button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-4">
          ← Volver a Ferias
        </button>
      </Link>

      {/* Header feria */}
      <div className="bg-vs-green text-white rounded-2xl p-5 mb-5">
        <div className="text-xs font-body opacity-75 mb-1 uppercase tracking-wide">Feria</div>
        <div className="font-display font-black text-xl leading-tight">{feria.nombre}</div>
        <div className="font-body text-sm opacity-85 mt-1">
          📍 {feria.ubicacion} · 📅{" "}
          {new Date(feria.fecha + "T00:00:00").toLocaleDateString("es-CL", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </div>
        {!esProxima && (
          <div className="flex gap-5 mt-4">
            <div>
              <div className="text-[10px] opacity-70 uppercase">Ingresos</div>
              <div className="font-display font-black text-xl">{fmt(totalIngresos)}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70 uppercase">Ganancia neta</div>
              <div className={`font-display font-black text-xl ${gananciaNeta >= 0 ? "text-green-300" : "text-red-300"}`}>
                {fmt(gananciaNeta)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODO: Armar canasta (feria próxima sin items) */}
      {esProxima && items.length === 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">🎯 Armar canasta</h2>
          <p className="font-body text-vs-muted text-sm mb-4">
            Indica cuántas unidades llevarás de cada producto.
          </p>
          <div className="space-y-3 mb-6">
            {productos.map((p) => (
              <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-body font-bold text-vs-text text-sm">{p.nombre}</div>
                  <div className="font-body text-vs-muted text-xs">Stock: {p.stock_actual} u · {fmt(p.precio_venta)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCanasta((c) => ({ ...c, [p.id]: Math.max(0, (c[p.id] ?? 0) - 1) }))}
                    className="w-8 h-8 rounded-full border border-vs-border bg-white font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors"
                  >−</button>
                  <span className="font-display font-black text-vs-green text-lg w-8 text-center">
                    {canasta[p.id] ?? 0}
                  </span>
                  <button
                    onClick={() => setCanasta((c) => ({ ...c, [p.id]: Math.min(p.stock_actual, (c[p.id] ?? 0) + 1) }))}
                    className="w-8 h-8 rounded-full border border-vs-border bg-white font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleGuardarCanasta}
            disabled={saving || Object.values(canasta).every((v) => v === 0)}
            className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar canasta ✓"}
          </button>
        </div>
      )}

      {/* MODO: Registrar ventas (feria con items, no finalizada) */}
      {!esFinalizada && items.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Registro de ventas</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => {
              const vendido = item.cantidad_vendida;
              const llevado = item.cantidad_llevada;
              const pct = llevado > 0 ? (vendido / llevado) * 100 : 0;
              return (
                <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-body font-bold text-vs-text text-sm">{item.producto?.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">
                        Llevé: {llevado} · Devuelvo: {llevado - vendido}
                      </div>
                    </div>
                    <div className="font-display font-black text-vs-green text-base">
                      {fmt(vendido * (item.precio_venta_feria ?? 0))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-vs-muted text-xs font-semibold">Vendidos:</span>
                    <button onClick={() => updateVendidos(item.id, -1)}
                      className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors">−</button>
                    <span className="font-display font-black text-vs-green text-xl w-8 text-center">{vendido}</span>
                    <button onClick={() => updateVendidos(item.id, 1)}
                      className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors">+</button>
                    <div className="flex-1">
                      <div className="bg-vs-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-vs-green h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-body text-vs-muted text-xs">{Math.round(pct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="bg-vs-greenPale rounded-2xl p-4 mb-4">
            <div className="flex justify-between font-body text-sm text-vs-green mb-2">
              <span>Gastos feria</span>
              <span className="font-bold">−{fmt(gastosFeria)}</span>
            </div>
            <div className="flex justify-between font-display font-black text-vs-green text-lg">
              <span>Ganancia neta</span>
              <span>{fmt(gananciaNeta)}</span>
            </div>
          </div>

          <button
            onClick={handleCerrarFeria}
            disabled={saving}
            className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar y actualizar stock ✓"}
          </button>
        </div>
      )}

      {/* MODO: Ver resultados (feria finalizada) */}
      {esFinalizada && items.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Resultados</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-body font-bold text-vs-text text-sm">{item.producto?.nombre}</div>
                    <div className="font-body text-vs-muted text-xs">
                      {item.cantidad_vendida} / {item.cantidad_llevada} vendidos
                    </div>
                  </div>
                  <div className="font-display font-black text-vs-green text-base">
                    {fmt(item.cantidad_vendida * (item.precio_venta_feria ?? 0))}
                  </div>
                </div>
                <div className="mt-2 bg-vs-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-vs-greenLight h-full rounded-full"
                    style={{ width: `${item.cantidad_llevada > 0 ? (item.cantidad_vendida / item.cantidad_llevada) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
