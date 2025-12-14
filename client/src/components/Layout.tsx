import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, Settings2, Zap, Menu, BarChart2, CalendarDays, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEKLY_KPIS } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Library", icon: Library, href: "/library" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
  { label: "Strategy", icon: Settings2, href: "/strategy" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#050505] border-r border-white/10">
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight leading-none text-white">CREATOR</span>
            <span className="font-display font-bold text-xl tracking-tight leading-none bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">PULSE</span>
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

      {user && (
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white truncate max-w-[120px]" data-testid="text-user-name">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-xs text-zinc-500 truncate max-w-[120px]" data-testid="text-user-email">
                  {user.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-zinc-500 hover:text-white hover:bg-white/5"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="border border-white/10 bg-zinc-900/30 p-5 space-y-4">
          <div className="flex justify-between items-end">
            <span className="font-display text-xs font-bold text-zinc-500 uppercase tracking-wider">Weekly Goals</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-mono block">Posts</span>
              <div className="flex items-end gap-1">
                <span className="text-white font-bold">{WEEKLY_KPIS.posts.current}</span>
                <span className="text-zinc-600 text-xs">/ {WEEKLY_KPIS.posts.target}</span>
              </div>
              <div className="h-0.5 bg-zinc-800 w-full mt-1">
                <div className="h-full bg-white w-[60%]" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-mono block">Reels</span>
              <div className="flex items-end gap-1">
                <span className="text-white font-bold">{WEEKLY_KPIS.reels.current}</span>
                <span className="text-zinc-600 text-xs">/ {WEEKLY_KPIS.reels.target}</span>
              </div>
              <div className="h-0.5 bg-zinc-800 w-full mt-1">
                <div className="h-full bg-emerald-500 w-[33%]" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-mono block">Stories</span>
              <div className="flex items-end gap-1">
                <span className="text-white font-bold">{WEEKLY_KPIS.stories.current}</span>
                <span className="text-zinc-600 text-xs">/ {WEEKLY_KPIS.stories.target}</span>
              </div>
              <div className="h-0.5 bg-zinc-800 w-full mt-1">
                <div className="h-full bg-indigo-500 w-[60%]" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-mono block">Shoutouts</span>
              <div className="flex items-end gap-1">
                <span className="text-white font-bold">{WEEKLY_KPIS.shoutouts.current}</span>
                <span className="text-zinc-600 text-xs">/ {WEEKLY_KPIS.shoutouts.target}</span>
              </div>
              <div className="h-0.5 bg-zinc-800 w-full mt-1">
                <div className="h-full bg-purple-500 w-[40%]" />
              </div>
            </div>
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
