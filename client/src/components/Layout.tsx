import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, Settings2, BarChart3, Menu, Zap } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Library", icon: Library, href: "/library" },
  { label: "Strategy", icon: Settings2, href: "/strategy" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#050505] border-r border-white/10">
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold">
            <Zap className="w-6 h-6 fill-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight leading-none text-white">CONTENT</span>
            <span className="font-display font-bold text-xl tracking-tight leading-none text-zinc-500">FLOW</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "group flex items-center gap-4 px-0 py-2 text-lg font-display font-medium transition-all cursor-pointer select-none",
                  isActive
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <div className={cn(
                  "w-1 h-1 bg-current rounded-full transition-all duration-300",
                  isActive ? "w-2 bg-white scale-150" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                )} />
                <span className="tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-8">
        <div className="border border-white/10 bg-zinc-900/30 p-4">
          <div className="flex justify-between items-end mb-2">
            <span className="font-display text-xs font-bold text-zinc-500 uppercase tracking-wider">Weekly Goal</span>
            <span className="font-mono text-xs text-white">13/20</span>
          </div>
          <div className="w-full bg-zinc-800 h-1">
            <div className="bg-white h-full w-[65%] shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-white selection:text-black">
      <div className="noise-bg" />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 fixed h-full z-20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-6 left-6 z-50 hover:bg-transparent">
            <Menu className="w-8 h-8 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 border-r-white/10 w-72 bg-black">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 relative z-10">
        <div className="max-w-[1600px] mx-auto p-6 md:p-12 lg:p-16 space-y-12 animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
