"use client";
import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  const install = async () => {
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 max-w-sm mx-auto bg-vs-green text-white rounded-2xl p-4 flex items-center gap-3 shadow-xl z-50">
      <span className="text-2xl flex-shrink-0">🌿</span>
      <div className="flex-1 min-w-0">
        <p className="font-body font-bold text-sm">Instalar VitalStock</p>
        <p className="font-body text-xs opacity-80">Accede rápido desde tu pantalla de inicio</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => setPrompt(null)} className="font-body text-xs opacity-70 px-2 py-1">
          Ahora no
        </button>
        <button onClick={install} className="bg-white text-vs-green font-body font-bold text-xs px-3 py-2 rounded-xl">
          Instalar
        </button>
      </div>
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
