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
      <FeriaHeader
        feria={feria}
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

      {/* MODO: Registrar ventas (feria con items, no finalizada) */}
      {!esFinalizada && items.length > 0 && (
        <RegistrarVentasView
          items={items}
          updateVendidos={updateVendidos}
          gastosFeria={gastosFeria}
          gananciaNeta={gananciaNeta}
          handleCerrarFeria={handleCerrarFeria}
          saving={saving}
        />
      )}

      {/* MODO: Ver resultados (feria finalizada) */}
      {esFinalizada && items.length > 0 && (
        <ResultadosFeriaView items={items} />
      )}
    </div>
  );
}
