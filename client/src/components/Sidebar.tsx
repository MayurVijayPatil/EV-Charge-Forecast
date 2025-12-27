import { Link, useLocation } from "wouter";
import { BarChart3, Upload, PieChart, Home, Activity, Zap, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Forecasts", href: "/forecasts", icon: Activity },
    { label: "Grid Impact", href: "/grid-impact", icon: Zap },
    { label: "Data Upload", href: "/upload", icon: Upload },
    { label: "Reports", href: "/reports", icon: PieChart },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-md shadow-md border border-border text-foreground"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={clsx(
        "bg-card border-r border-border h-screen flex-col overflow-y-auto",
        // Desktop styles
        "md:sticky md:top-0 md:flex md:w-64",
        // Mobile styles: fixed overlay when open, hidden when closed (unless desktop)
        isMobileOpen ? "fixed inset-y-0 left-0 z-50 w-64 flex shadow-xl" : "hidden"
      )}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none">EV Forecaster</h1>
              <p className="text-xs text-muted-foreground mt-1">Gov Analytics v1.0</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)} className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={clsx("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last sync: 2 mins ago</p>
          </div>
        </div>
      </aside>
    </>
  );
}
