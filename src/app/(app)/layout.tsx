import Navbar from "@/components/ui/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vs-bg">
      {/* Header */}
      <header className="bg-white border-b border-vs-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-vs-green flex items-center justify-center text-lg">
              🌿
            </div>
            <div>
              <div className="font-display font-black text-vs-text text-base leading-none">VitalStock</div>
              <div className="font-body text-vs-muted text-xs">Tu inventario saludable</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl bg-vs-greenPale flex items-center justify-center text-base hover:bg-vs-green hover:text-white transition-colors">
              🔔
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {children}
      </main>

      {/* Bottom Navbar */}
      <Navbar />
    </div>
  );
}
