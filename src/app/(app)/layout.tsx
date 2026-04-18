import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/ui/Navbar";
import StockAlerts from "@/components/StockAlerts";
import DarkModeToggle from "@/components/DarkModeToggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-vs-bg">
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
            <DarkModeToggle />
            <StockAlerts />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {children}
      </main>

      <Navbar />
    </div>
  );
}
