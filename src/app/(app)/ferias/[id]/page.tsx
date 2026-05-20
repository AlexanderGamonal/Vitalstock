"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/utils";
import type { Feria, FeriaProducto, Producto } from "@/types/database";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FeriaHeader, ArmarCanastaView, RegistrarVentasView, ResultadosFeriaView } from "./FeriaViews";

export default function FeriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const router = useRouter();

  const [feria, setFeria] = useState<Feria | null>(null);
  const [items, setItems] = useState<(FeriaProducto & { producto: Producto })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Devoluciones (track returns; vendido = llevado - devuelto)
  const [devoluciones, setDevoluciones] = useState<Record<string, number>>({});

  const updateDevoluciones = (itemId: string, delta: number) => {
    setDevoluciones((prev) => {
      const item = items.find((i) => i.id === itemId)!;
      const current = prev[itemId] ?? 0;
      return { ...prev, [itemId]: Math.max(0, Math.min(item.cantidad_llevada, current + delta)) };
    });
  };

  // Canasta editing
  const [editandoCanasta, setEditandoCanasta] = useState(false);
  const [editItems, setEditItems] = useState<Record<string, { fpId: string; cantidad: number }>>({});
  const [nuevasAdiciones, setNuevasAdiciones] = useState<Record<string, number>>({});

  // Para armar canasta nueva
  const [canasta, setCanasta] = useState<Record<string, number>>({});

  // Auto-save canasta draft to localStorage on every change
  useEffect(() => {
    if (!id) return;
    if (Object.values(canasta).some((v) => v > 0)) {
      localStorage.setItem(`canasta_draft_${id}`, JSON.stringify(canasta));
    } else {
      localStorage.removeItem(`canasta_draft_${id}`);
    }
  }, [canasta, id]);

  useEffect(() => {
    const load = async () => {
      const [{ data: f }, { data: fp }, { data: p }] = await Promise.all([
        supabase.from("ferias").select("*").eq("id", id).single(),
        supabase.from("feria_productos").select("*, producto:productos(*)").eq("feria_id", id),
        supabase.from("productos").select("*").eq("activo", true).gt("stock_actual", 0).order("nombre"),
      ]);
      setFeria(f as Feria);
      setItems((fp ?? []) as (FeriaProducto & { producto: Producto })[]);
      setProductos((p ?? []) as Producto[]);
      // Restore canasta draft from localStorage if feria has no items yet
      if ((fp ?? []).length === 0) {
        try {
          const draft = localStorage.getItem(`canasta_draft_${id}`);
          if (draft) setCanasta(JSON.parse(draft));
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const totalIngresos = items.reduce((a, i) => {
    const vendido = i.cantidad_llevada - (devoluciones[i.id] ?? 0);
    return a + vendido * (i.precio_venta_feria ?? i.producto?.precio_venta ?? 0);
  }, 0);
  const totalCostos = items.reduce((a, i) => {
    const vendido = i.cantidad_llevada - (devoluciones[i.id] ?? 0);
    return a + vendido * (i.producto?.precio_costo ?? 0);
  }, 0);
  const gastosFeria = (feria?.costo_inscripcion ?? 0) + (feria?.costo_transporte ?? 0);
  const gananciaNeta = totalIngresos - totalCostos - gastosFeria;

  // Guardar canasta nueva
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
          precio_venta_feria: p?.precio_descuento ?? p?.precio_venta ?? 0,
        };
      });

    await supabase.from("feria_productos").insert(rows);
    localStorage.removeItem(`canasta_draft_${id}`);
    router.refresh();
    window.location.reload();
  };

  // Entrar a modo edición de canasta
  const entrarEditCanasta = () => {
    const initial: Record<string, { fpId: string; cantidad: number }> = {};
    items.forEach((i) => {
      initial[i.producto_id] = { fpId: i.id, cantidad: i.cantidad_llevada };
    });
    setEditItems(initial);
    setNuevasAdiciones({});
    setEditandoCanasta(true);
  };

  // Guardar edición de canasta
  const handleGuardarEditCanasta = async () => {
    setSaving(true);
    for (const [productoId, { fpId, cantidad }] of Object.entries(editItems)) {
      const original = items.find((i) => i.id === fpId);
      if (cantidad === 0) {
        await supabase.from("feria_productos").delete().eq("id", fpId);
      } else if (original && original.cantidad_llevada !== cantidad) {
        await supabase.from("feria_productos").update({ cantidad_llevada: cantidad }).eq("id", fpId);
      }
    }
    for (const [productoId, cantidad] of Object.entries(nuevasAdiciones)) {
      if (cantidad > 0) {
        const p = productos.find((pr) => pr.id === productoId);
        await supabase.from("feria_productos").insert({
          feria_id: id,
          producto_id: productoId,
          cantidad_llevada: cantidad,
          cantidad_vendida: 0,
          precio_venta_feria: p?.precio_descuento ?? p?.precio_venta ?? 0,
        });
      }
    }
    setEditandoCanasta(false);
    setSaving(false);
    window.location.reload();
  };

  // Guardar ventas y cerrar feria
  const handleCerrarFeria = async () => {
    setSaving(true);
    for (const item of items) {
      const vendido = item.cantidad_llevada - (devoluciones[item.id] ?? 0);
      await supabase
        .from("feria_productos")
        .update({ cantidad_vendida: vendido })
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

  // Products not yet in the basket
  const productosEnCanasta = new Set(items.map((i) => i.producto_id));
  const productosDisponibles = productos.filter((p) => !productosEnCanasta.has(p.id));

  return (
    <div>
      <Link href="/ferias">
        <button className="flex items-center gap-2 text-vs-green font-body font-bold text-sm mb-4">
          ← Volver a Ferias
        </button>
      </Link>

      <FeriaHeader
        feria={feria}
        id={id}
        esProxima={esProxima}
        totalIngresos={totalIngresos}
        gananciaNeta={gananciaNeta}
      />

      {/* MODO: Armar canasta (feria próxima sin items) */}
      {esProxima && items.length === 0 && (
        <ArmarCanastaView
          productos={productos}
          canasta={canasta}
          setCanasta={setCanasta}
          handleGuardarCanasta={handleGuardarCanasta}
          saving={saving}
        />
      )}

      {/* MODO: Registrar ventas (feria con items, no finalizada, no editando) */}
      {!esFinalizada && items.length > 0 && !editandoCanasta && (
        <>
          <RegistrarVentasView
            items={items}
            devoluciones={devoluciones}
            updateDevoluciones={updateDevoluciones}
            gastosFeria={gastosFeria}
            gananciaNeta={gananciaNeta}
            handleCerrarFeria={handleCerrarFeria}
            saving={saving}
          />
          <button
            onClick={entrarEditCanasta}
            className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-vs-green border border-vs-border hover:border-vs-green transition-colors"
          >
            ✏️ Editar canasta
          </button>
        </>
      )}

      {/* MODO: Editar canasta */}
      {!esFinalizada && items.length > 0 && editandoCanasta && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">✏️ Editar canasta</h2>

          <div className="space-y-3 mb-5">
            {items.map((item) => {
              const edit = editItems[item.producto_id] ?? { fpId: item.id, cantidad: item.cantidad_llevada };
              if (edit.cantidad === 0) return null;
              return (
                <div key={item.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-body font-bold text-vs-text text-sm truncate">{item.producto?.nombre}</div>
                    <div className="font-body text-vs-muted text-xs">{fmt(item.precio_venta_feria ?? 0)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setEditItems((prev) => ({
                          ...prev,
                          [item.producto_id]: { fpId: item.id, cantidad: Math.max(0, (prev[item.producto_id]?.cantidad ?? item.cantidad_llevada) - 1) },
                        }))
                      }
                      className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors"
                    >−</button>
                    <span className="font-display font-black text-vs-green text-lg w-8 text-center">{edit.cantidad}</span>
                    <button
                      onClick={() =>
                        setEditItems((prev) => ({
                          ...prev,
                          [item.producto_id]: { fpId: item.id, cantidad: (prev[item.producto_id]?.cantidad ?? item.cantidad_llevada) + 1 },
                        }))
                      }
                      className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors"
                    >+</button>
                    <button
                      onClick={() =>
                        setEditItems((prev) => ({
                          ...prev,
                          [item.producto_id]: { fpId: item.id, cantidad: 0 },
                        }))
                      }
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-base hover:bg-red-100 transition-colors"
                    >🗑</button>
                  </div>
                </div>
              );
            })}
          </div>

          {productosDisponibles.length > 0 && (
            <>
              <h3 className="font-display font-bold text-vs-text text-base mb-2">Agregar productos</h3>
              <div className="space-y-3 mb-5">
                {productosDisponibles.map((p) => (
                  <div key={p.id} className="bg-white border border-vs-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-vs-text text-sm truncate">{p.nombre}</div>
                      <div className="font-body text-vs-muted text-xs">Stock: {p.stock_actual} u · {fmt(p.precio_venta)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(nuevasAdiciones[p.id] ?? 0) > 0 && (
                        <button
                          onClick={() =>
                            setNuevasAdiciones((prev) => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 0) - 1) }))
                          }
                          className="w-8 h-8 rounded-full border border-vs-border font-body font-bold text-vs-text flex items-center justify-center hover:border-vs-green transition-colors"
                        >−</button>
                      )}
                      {(nuevasAdiciones[p.id] ?? 0) > 0 && (
                        <span className="font-display font-black text-vs-green text-lg w-8 text-center">{nuevasAdiciones[p.id]}</span>
                      )}
                      <button
                        onClick={() =>
                          setNuevasAdiciones((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))
                        }
                        className="w-8 h-8 rounded-full bg-vs-greenPale text-vs-green font-body font-bold flex items-center justify-center hover:bg-vs-green hover:text-white transition-colors"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleGuardarEditCanasta}
            disabled={saving}
            className="w-full bg-vs-green text-white font-body font-bold text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar canasta ✓"}
          </button>
          <button
            onClick={() => setEditandoCanasta(false)}
            className="w-full mt-3 py-3 rounded-2xl font-body font-bold text-sm text-vs-muted border border-vs-border hover:border-vs-green transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* MODO: Ver resultados (feria finalizada) */}
      {esFinalizada && items.length > 0 && (
        <ResultadosFeriaView items={items} />
      )}
    </div>
  );
}
