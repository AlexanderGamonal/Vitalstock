"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-vs-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vs-green text-3xl mb-4">
            🌿
          </div>
          <h1 className="font-display text-3xl font-black text-vs-text">VitalStock</h1>
          <p className="text-vs-muted font-body text-sm mt-1">Crea tu contraseña para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-vs-border p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-vs-text mb-6">Crear contraseña</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-body">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block font-body font-bold text-sm text-vs-text mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block font-body font-bold text-sm text-vs-text mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              className="w-full px-4 py-3 rounded-xl border border-vs-border font-body text-sm text-vs-text bg-white outline-none focus:border-vs-green transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vs-green text-white font-body font-bold text-base py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar contraseña →"}
          </button>
        </form>
      </div>
    </div>
  );
}
