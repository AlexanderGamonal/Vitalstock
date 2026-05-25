"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DemoBanner from "./DemoBanner";
import DemoNavbar from "./DemoNavbar";
import { getDemoUserConfig } from "@/lib/demo/store";
import type { DemoUserConfig } from "@/lib/demo/store";

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [config, setConfig] = useState<DemoUserConfig | null>(null);
  const [ready, setReady] = useState(false);
  const isSetup = pathname === "/demo/setup";

  useEffect(() => {
    const cfg = getDemoUserConfig();
    if (!cfg && !isSetup) {
      router.replace("/demo/setup");
      return;
    }
    if (cfg) {
      setConfig(cfg);
      document.documentElement.style.setProperty("--vs-green", cfg.colorPrimary);
      document.documentElement.style.setProperty("--vs-green-light", cfg.colorLight);
      document.documentElement.style.setProperty("--vs-green-pale", cfg.colorPale);
    }
    setReady(true);
  }, [isSetup, router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-vs-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-vs-green border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isSetup) {
    return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-vs-bg">
      <DemoBanner config={config} />
      <header className="bg-white border-b border-vs-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-vs-green flex items-center justify-center text-lg">🛍️</div>
          )}
          <div>
            <div className="font-display font-black text-vs-text text-base leading-none">{config?.nombre || "Mi Tienda"}</div>
            <div className="font-body text-vs-muted text-xs">Tu inventario bajo control</div>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-5 pb-24">{children}</main>
      <DemoNavbar />
    </div>
  );
}
