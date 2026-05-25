"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetDemo, resetDemoFull } from "@/lib/demo/store";
import type { DemoUserConfig } from "@/lib/demo/store";

export default function DemoBanner({ config }: { config: DemoUserConfig | null }) {
  const router = useRouter();
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!config?.expires) { setDays(null); return; }
    const exp = new Date(config.expires + "T23:59:59");
    setDays(Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [config]);

  if (days === null) return null;

  if (days <= 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">⏰</div>
        <div className="font-display font-black text-white text-2xl mb-2">Demo finalizado</div>
        <p className="font-body text-gray-300 text-sm mb-6">
          El período de prueba ha expirado. Contacta al vendedor para activar tu versión completa.
        </p>
        <button
          onClick={() => { resetDemoFull(); router.replace("/demo/setup"); }}
          className="font-body text-gray-400 text-xs underline"
        >
          Comenzar nuevo demo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-vs-green text-white text-center py-2 px-4 text-xs font-body font-bold flex items-center justify-center gap-2">
      <span>🎯 Modo demo</span>
      <span className="opacity-80">
        — {days > 0 ? `${days} día${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}` : "vence hoy"}
      </span>
      <button
        onClick={() => { if (confirm("¿Reiniciar todos los datos del demo?")) { resetDemo(); window.location.reload(); } }}
        className="ml-3 opacity-60 hover:opacity-100 underline text-[10px]"
      >
        Reiniciar datos
      </button>
    </div>
  );
}
