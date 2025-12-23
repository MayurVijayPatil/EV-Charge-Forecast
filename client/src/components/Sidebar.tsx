import { Link, useLocation } from "wouter";
import { BarChart3, Upload, PieChart, Home, Activity } from "lucide-react";
import { clsx } from "clsx";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Forecasts", href: "/forecasts", icon: Activity },
    { label: "Data Upload", href: "/upload", icon: Upload },
    { label: "Reports", href: "/reports", icon: PieChart },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">EV Forecaster</h1>
            <p className="text-xs text-muted-foreground mt-1">Gov Analytics v1.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx(
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

      <div className="p-4 border-t border-border">
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
  );
}
