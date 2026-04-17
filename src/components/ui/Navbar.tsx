"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", icon: "🏠", label: "Inicio" },
  { href: "/productos", icon: "📦", label: "Productos" },
  { href: "/ferias", icon: "🎪", label: "Ferias" },
  { href: "/reportes", icon: "📊", label: "Reportes" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-vs-border z-40">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <span className={`text-xl ${!active && "opacity-50"}`}>{tab.icon}</span>
              <span
                className={`font-body text-[10px] font-bold ${
                  active ? "text-vs-green" : "text-vs-muted"
                }`}
              >
                {tab.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-vs-green" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
