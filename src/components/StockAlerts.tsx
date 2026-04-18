"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Producto } from "@/types/database";

export default function StockAlerts() {
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<Producto[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .from("v_stock_bajo")
      .select("*")
      .then(({ data }) => setAlertas((data as Producto[]) ?? []));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-vs-greenPale flex items-center justify-center text-base hover:bg-vs-green hover:text-white transition-colors"
      >
        🔔
        {alertas.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white border border-vs-border rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-vs-border">
            <p className="font-body font-bold text-vs-text text-sm">Alertas de stock</p>
          </div>
          {alertas.length === 0 ? (
            <div className="p-5 text-center font-body text-vs-muted text-sm">
              ✅ Todo en orden
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-vs-border">
              {alertas.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{p.stock_actual === 0 ? "🚨" : "⚠️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-vs-text text-xs truncate">{p.nombre}</p>
                    <p className="font-body text-vs-muted text-xs">
                      {p.stock_actual === 0 ? "Agotado" : `Stock: ${p.stock_actual}`} · mín: {p.stock_minimo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
