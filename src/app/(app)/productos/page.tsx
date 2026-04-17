export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { fmt, calcMargen } from "@/lib/utils";
import type { Producto } from "@/types/database";
import Link from "next/link";

export default async function ProductosPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .schema("vitalstock")
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  const lista = (productos as Producto[]) ?? [];
  const stockBajo = lista.filter((p) => p.stock_actual <= p.stock_minimo);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-black text-vs-text text-2xl">Productos</h1>
        <Link href="/productos/nuevo">
          <button className="bg-vs-green text-white font-body font-bold text-sm px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">
            + Agregar
          </button>
        </Link>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-vs-green text-xl">{lista.length}</div>
          <div className="font-body text-vs-muted text-xs">Total</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-red-500 text-xl">{stockBajo.length}</div>
          <div className="font-body text-vs-muted text-xs">Stock bajo</div>
        </div>
        <div className="bg-white border border-vs-border rounded-xl p-3 text-center">
          <div className="font-display font-black text-vs-accent text-xl">
            {lista.reduce((a, p) => a + p.stock_actual, 0)}
          </div>
          <div className="font-body text-vs-muted text-xs">Unidades</div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {lista.map((p) => {
          const isLow = p.stock_actual <= p.stock_minimo;
          const isOut = p.stock_actual === 0;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-4 ${
                isOut
                  ? "border-red-300"
                  : isLow
                  ? "border-red-200"
                  : "border-vs-border"
              }`}
            >
              <div className="flex gap-3 items-start">
                {/* Foto o placeholder */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isLow ? "bg-red-50" : "bg-vs-greenPale"}`}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    "📦"
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-body font-bold text-vs-text text-sm leading-tight">{p.nombre}</div>
                      {p.descripcion && (
                        <div className="font-body text-vs-muted text-xs mt-0.5 truncate">{p.descripcion}</div>
                      )}
                      {p.categoria && (
                        <span className="inline-block mt-1 bg-vs-greenPale text-vs-green font-body font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {p.categoria}
                        </span>
                      )}
                    </div>
                    <span className={`font-body font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      isOut
                        ? "bg-red-100 text-red-700"
                        : isLow
                        ? "bg-red-50 text-red-600"
                        : "bg-vs-greenPale text-vs-green"
                    }`}>
                      {isOut ? "Agotado" : `${p.stock_actual} u`}
                    </span>
                  </div>

                  {/* Precios */}
                  <div className="flex gap-4 mt-2">
                    <div>
                      <div className="font-body text-vs-muted text-[10px]">Venta</div>
                      <div className="font-display font-black text-vs-green text-sm">{fmt(p.precio_venta)}</div>
                    </div>
                    <div>
                      <div className="font-body text-vs-muted text-[10px]">Costo</div>
                      <div className="font-body font-bold text-vs-muted text-sm">{fmt(p.precio_costo)}</div>
                    </div>
                    <div>
                      <div className="font-body text-vs-muted text-[10px]">Margen</div>
                      <div className="font-body font-bold text-vs-accent text-sm">{calcMargen(p.precio_venta, p.precio_costo)}%</div>
                    </div>
                  </div>

                  {isLow && !isOut && (
                    <p className="font-body text-red-600 text-xs font-semibold mt-2">
                      ⚠ Stock bajo — mínimo: {p.stock_minimo} u
                    </p>
                  )}
                  {p.fecha_venc && (
                    <p className="font-body text-vs-muted text-xs mt-1">
                      Vence: {new Date(p.fecha_venc + "T00:00:00").toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {lista.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <div className="font-display font-bold text-vs-text text-lg">Sin productos aún</div>
            <p className="font-body text-vs-muted text-sm mt-2 mb-6">Agrega tu primer producto saludable</p>
            <Link href="/productos/nuevo">
              <button className="bg-vs-green text-white font-body font-bold px-6 py-3 rounded-xl">
                + Agregar producto
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
