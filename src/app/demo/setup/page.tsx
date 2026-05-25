"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDemoUserConfig, seedIfEmpty } from "@/lib/demo/store";

const COLOR_PRESETS = [
  { label: "Verde",   primary: "#2D6A4F", light: "#52B788", pale: "#D8F3DC" },
  { label: "Azul",    primary: "#1D4ED8", light: "#3B82F6", pale: "#DBEAFE" },
  { label: "Violeta", primary: "#6D28D9", light: "#8B5CF6", pale: "#EDE9FE" },
  { label: "Naranja", primary: "#C2410C", light: "#F97316", pale: "#FFEDD5" },
  { label: "Rosa",    primary: "#BE185D", light: "#EC4899", pale: "#FCE7F3" },
  { label: "Rojo",    primary: "#991B1B", light: "#EF4444", pale: "#FEE2E2" },
];

function getExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split("T")[0];
}

export default function DemoSetupPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedColor = COLOR_PRESETS[colorIdx];

  const handleSubmit = () => {
    if (!nombre.trim()) { setError("El nombre del negocio es obligatorio"); return; }
    setLoading(true);
    saveDemoUserConfig({
      nombre: nombre.trim(),
      logoUrl: logoUrl.trim(),
      colorPrimary: selectedColor.primary,
      colorLight: selectedColor.light,
      colorPale: selectedColor.pale,
      expires: getExpiry(),
    });
    seedIfEmpty();
    router.replace("/demo/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛍️</div>
          <h1 className="font-display font-black text-gray-800 text-2xl leading-tight">
            Personaliza tu demo
          </h1>
          <p className="font-body text-gray-500 text-sm mt-2">
            Configúralo en 1 minuto y explora todas las funciones
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-xs font-body">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block font-body font-bold text-gray-700 text-sm mb-1.5">
              Nombre de tu negocio *
            </label>
            <input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(""); }}
              placeholder="ej. Cosméticos Luna"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block font-body font-bold text-gray-700 text-sm mb-1.5">
              Logo — URL de imagen (opcional)
            </label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://mi-logo.com/logo.png"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
            />
            {logoUrl && (
              <img
                src={logoUrl}
                alt="preview"
                className="mt-2 w-12 h-12 rounded-xl object-cover border border-gray-100"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>

          <div>
            <label className="block font-body font-bold text-gray-700 text-sm mb-2">
              Color principal
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  title={c.label}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    colorIdx === i
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.primary }}
                />
              ))}
            </div>
            <p className="font-body text-gray-400 text-xs mt-1.5">
              Seleccionado: {selectedColor.label}
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-8 py-4 rounded-2xl font-body font-bold text-base text-white transition-all hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: selectedColor.primary }}
        >
          {loading ? "Iniciando…" : "Comenzar prueba gratuita de 15 días →"}
        </button>

        <p className="text-center font-body text-gray-400 text-xs mt-3">
          Sin tarjeta de crédito · Sin registro
        </p>
      </div>
    </div>
  );
}
