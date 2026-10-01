"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserPlus, Users, Trophy, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastContext";
import { cn } from "@/lib/utils";

const BASE_NAV_ITEMS = [
  { name: "CAPTACIÓN RÁPIDA", href: "/captacion", icon: UserPlus },
  { name: "PARTICIPANTES", href: "/participantes", icon: Users },
  { name: "SORTEO", href: "/sorteo", icon: Trophy },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { success, error } = useToast();
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        success("Sesión cerrada", "Ha salido del sistema.");
        router.push("/login");
        router.refresh();
      } else {
        error("Error al salir", "No se pudo cerrar sesión.");
      }
    } catch {
      error("Error", "Error de red.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Build nav items dynamically: Promotoras see 3 modules; Admin sees 3 modules + AUDITORÍA
  const navItems = [...BASE_NAV_ITEMS];
  if (currentUser?.role === "ADMIN") {
    navItems.push({ name: "AUDITORÍA", href: "/auditoria", icon: ShieldCheck });
  }

  // Don't render navbar on login page
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090b10]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand with Official Forthing Logo */}
        <Link href="/captacion" className="flex items-center gap-3.5 shrink-0 group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl p-1 bg-surface-card border border-white/10 group-hover:border-cyan-500/40 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <img
              src="/logo.png"
              alt="Forthing Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]"
            />
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-white text-sm sm:text-base font-mono">
              EXPO CHINA <span className="text-cyan-400">2026</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold hidden sm:block">
              Sorteo Mar de las Pampas • Forthing
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-surface p-1.5 rounded-2xl border border-white/10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all duration-200",
                  isActive
                    ? "bg-primary text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser && (
            <div className="text-right text-xs">
              <span className="block font-bold text-white">{currentUser.name}</span>
              <span className="text-[10px] text-gray-400 font-mono">{currentUser.role}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen((p) => !p)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0d1017] p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold font-mono",
                  isActive
                    ? "bg-primary text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                    : "text-gray-300 hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            {currentUser && (
              <span className="text-xs text-gray-400 font-mono">{currentUser.name}</span>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              isLoading={isLoggingOut}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Salir
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

