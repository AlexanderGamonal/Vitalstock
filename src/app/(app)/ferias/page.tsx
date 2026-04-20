"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/utils";
import type { ResumenFeria } from "@/types/database";
import Link from "next/link";

export default function FeriasPage() {
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<ResumenFeria[]>([]);

  useEffect(() => {
    createClient()
      .from("v_resumen_ferias")
      .select("*")
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        setLista((data as ResumenFeria[]) ?? []);
        setLoading(false);
      });
  }, []);

  const proximas = lista.filter((f) => f.estado === "proxima");
  const realizadas = lista.filter((f) => f.estado === "finalizada");

  if (loading) return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-5">
        <div className="h-7 w-24 bg-vs-border rounded-xl" />
        <div className="h-9 w-28 bg-vs-border rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-black text-vs-text text-2xl">Ferias</h1>
        <Link href="/ferias/nueva">
          <button className="bg-vs-green text-white font-body font-bold text-sm px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">
            + Nueva feria
          </button>
        </Link>
      </div>

      {proximas.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Próximas</h2>
          <div className="space-y-3">
            {proximas.map((f) => (
              <Link key={f.id} href={`/ferias/${f.id}`}>
                <div className="bg-vs-green text-white rounded-2xl p-4 relative overflow-hidden hover:bg-opacity-90 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vs-greenLight to-vs-accent" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-body text-xs opacity-75 bg-white bg-opacity-20 px-2 py-0.5 rounded-full">Próxima</span>
                      <div className="font-display font-black text-lg mt-2 leading-tight">{f.nombre}</div>
                      <div className="font-body text-sm opacity-85 mt-1">
                        📍 {f.ubicacion} · 📅{" "}
                        {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
                      </div>
                      <div className="font-body text-xs opacity-70 mt-1">
                        Inscripción: {fmt(f.costo_inscripcion)} · Transporte: {fmt(f.costo_transporte)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-white bg-opacity-20 rounded-xl px-4 py-2.5 text-center">
                    <span className="font-body font-bold text-sm">🎯 Armar canasta para esta feria →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {realizadas.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-vs-text text-lg mb-3">Realizadas</h2>
          <div className="space-y-3">
            {realizadas.map((f) => {
              const neta = Number(f.ganancia_neta);
              return (
                <Link key={f.id} href={`/ferias/${f.id}`}>
                  <div className="bg-white border border-vs-border rounded-2xl p-4 hover:border-vs-green transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body font-bold text-vs-text text-sm truncate">{f.nombre}</span>
                          <span className="bg-vs-greenPale text-vs-green font-body font-bold text-[10px] px-2 py-0.5 rounded-full flex-shrink-0">Realizada</span>
                        </div>
                        <div className="font-body text-vs-muted text-xs">
                          📍 {f.ubicacion} · {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-PE")}
                        </div>
                        <div className="font-body text-vs-muted text-xs mt-0.5">
                          Vendidos: {f.total_vendido} uds de {f.total_llevado}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-display font-black text-vs-green text-lg">{fmt(Number(f.total_ingresos))}</div>
                        <div className={`font-body font-semibold text-xs ${neta >= 0 ? "text-green-500" : "text-red-500"}`}>
                          Neto: {fmt(neta)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {lista.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎪</div>
          <div className="font-display font-bold text-vs-text text-lg">Sin ferias aún</div>
          <p className="font-body text-vs-muted text-sm mt-2 mb-6">Registra tu primera feria o evento</p>
          <Link href="/ferias/nueva">
            <button className="bg-vs-green text-white font-body font-bold px-6 py-3 rounded-xl">+ Nueva feria</button>
          </Link>
        </div>
      )}
    </div>
  );
}
