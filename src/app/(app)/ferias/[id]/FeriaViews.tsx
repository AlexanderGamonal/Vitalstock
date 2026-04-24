import Link from "next/link";
import { fmt } from "@/lib/utils";
import type { Feria, FeriaProducto, Producto } from "@/types/database";

export function FeriaHeader({
  feria,
  id,
  esProxima,
  totalIngresos,
  gananciaNeta,
}: {
  feria: Feria;
  id: string;
  esProxima: boolean;
  totalIngresos: number;
  gananciaNeta: number;
}) {
  return (
    <div className="bg-vs-green text-white rounded-2xl p-5 mb-5 relative">
      <Link href={`/ferias/${id}/editar`}>
        <button className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 transition-all flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </Link>
      <div className="text-xs font-body opacity-75 mb-1 uppercase tracking-wide">Feria</div>
      <div className="font-display font-black text-xl leading-tight">{feria.nombre}</div>
      <div className="font-body text-sm opacity-85 mt-1">
        📍 {feria.ubicacion} · 📅{" "}
        {new Date(feria.fecha + "T00:00:00").toLocaleDateString("es-CL", {
          day: "numeric",
          month: "long",
          year: "numeric",
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
  );
}

export function ArmarCanastaView({
  productos,
  canasta,
  setCanasta,
  handleGuardarCanasta,
  saving,
}: {
  productos: Producto[];
  canasta: Record<string, number>;
  setCanasta: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleGuardarCanasta: () => void;
  saving: boolean;
}) {
  return (
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
  );
}

export function RegistrarVentasView({
  items,
  updateVendidos,
  gastosFeria,
  gananciaNeta,
  handleCerrarFeria,
  saving,
}: {
  items: (FeriaProducto & { producto: Producto })[];
  updateVendidos: (itemId: string, delta: number) => void;
  gastosFeria: number;
  gananciaNeta: number;
  handleCerrarFeria: () => void;
  saving: boolean;
}) {
  return (
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
                <button
                  onClick={() => updateVendidos(item.id, -1)}
                  className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors"
                >−</button>
                <span className="font-display font-black text-vs-green text-xl w-8 text-center">{vendido}</span>
                <button
                  onClick={() => updateVendidos(item.id, 1)}
                  className="w-8 h-8 rounded-full border border-vs-border font-body text-vs-text flex items-center justify-center text-lg hover:border-vs-green transition-colors"
                >+</button>
                <div className="flex-1">
                  <div className="bg-vs-border rounded-full h-1.5 overflow-hidden">
                    <div className="bg-vs-green h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="font-body text-vs-muted text-xs">{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>

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
  );
}

export function ResultadosFeriaView({ items }: { items: (FeriaProducto & { producto: Producto })[] }) {
  return (
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
  );
}
