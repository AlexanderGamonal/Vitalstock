import DemoBanner from "@/components/demo/DemoBanner";
import DemoNavbar from "@/components/demo/DemoNavbar";
import { demoConfig } from "@/config/demo";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const { colorPrimary, colorLight, colorPale, nombre, tagline, emoji } = demoConfig;
  return (
    <div className="min-h-screen bg-vs-bg">
      <style>{`
        :root {
          --vs-green: ${colorPrimary};
          --vs-green-light: ${colorLight};
          --vs-green-pale: ${colorPale};
        }
      `}</style>

      <DemoBanner />

      <header className="bg-white border-b border-vs-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-vs-green flex items-center justify-center text-lg">
              {emoji}
            </div>
            <div>
              <div className="font-display font-black text-vs-text text-base leading-none">{nombre}</div>
              <div className="font-body text-vs-muted text-xs">{tagline}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {children}
      </main>

      <DemoNavbar />
    </div>
  );
}
