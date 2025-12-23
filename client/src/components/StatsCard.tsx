import { ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, trendLabel, className }: StatsCardProps) {
  return (
    <div className={clsx("dashboard-card p-6 flex flex-col justify-between h-full", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
        </div>
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          {icon}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span className={clsx(
            "flex items-center text-sm font-bold px-2 py-0.5 rounded-full",
            trend > 0 ? "bg-emerald-100 text-emerald-700" : trend < 0 ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-700"
          )}>
            {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : trend < 0 ? <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> : <Minus className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted-foreground">{trendLabel || "vs last year"}</span>
        </div>
      )}
    </div>
  );
}
