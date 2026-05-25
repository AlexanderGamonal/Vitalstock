"use client";

import { demoConfig } from "@/config/demo";
import { resetDemo } from "@/lib/demo/store";

function getDaysLeft(): number | null {
  if (!demoConfig.expires) return null;
  const exp = new Date(demoConfig.expires + "T23:59:59");
  const diff = exp.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DemoBanner() {
  if (!demoConfig.expires) return null;
  const days = getDaysLeft();

  if (days !== null && days <= 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">⏰</div>
        <div className="font-display font-black text-white text-2xl mb-2">Demo finalizado</div>
        <p className="font-body text-gray-300 text-sm mb-6">
          El período de prueba ha expirado. Contacta al vendedor para activar tu versión completa.
        </p>
        <button
          onClick={() => { resetDemo(); window.location.reload(); }}
          className="font-body text-gray-500 text-xs underline"
        >
          Reiniciar demo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-vs-green text-white text-center py-2 px-4 text-xs font-body font-bold flex items-center justify-center gap-2">
      <span>🎯 Modo demo</span>
      {days !== null && (
        <span className="opacity-80">
          — {days > 0 ? `${days} día${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}` : "vence hoy"}
        </span>
      )}
      <button
        onClick={() => { if (confirm("¿Reiniciar todos los datos del demo?")) { resetDemo(); window.location.reload(); } }}
        className="ml-3 opacity-60 hover:opacity-100 underline text-[10px]"
      >
        Reiniciar
      </button>
    </div>
  );
}
