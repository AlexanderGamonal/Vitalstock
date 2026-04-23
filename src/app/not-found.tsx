import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-vs-bg flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">🌱</div>
      <h2 className="font-display font-black text-vs-text text-3xl mb-2">404</h2>
      <h3 className="font-display font-bold text-vs-text text-lg mb-2">Página no encontrada</h3>
      <p className="font-body text-vs-muted text-sm mb-8 max-w-[280px]">
        Parece que te has perdido. La ruta que buscas no existe o ha sido movida.
      </p>
      <Link href="/dashboard">
        <button className="bg-vs-green text-white font-body font-bold text-base px-8 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-sm">
          ← Volver a VitalStock
        </button>
      </Link>
    </div>
  );
}
