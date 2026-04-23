"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="font-display font-black text-vs-text text-xl mb-2">Algo salió mal</h2>
      <p className="font-body text-vs-muted text-sm mb-6 max-w-[280px]">
        Ocurrió un error inesperado al cargar esta sección. Puedes intentar nuevamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-vs-green text-white font-body font-bold text-sm px-5 py-3 rounded-xl hover:bg-opacity-90 transition-all"
        >
          Reintentar
        </button>
        <Link href="/dashboard">
          <button className="bg-white border border-vs-border text-vs-text font-body font-bold text-sm px-5 py-3 rounded-xl hover:border-vs-green transition-colors">
            Ir al Inicio
          </button>
        </Link>
      </div>
    </div>
  );
}
