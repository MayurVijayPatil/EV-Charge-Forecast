import { Bell, Search, User } from "lucide-react";

export function Header({ title }: { title: string }) {
  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-30 border-b border-border px-8 py-5 flex items-center justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm hidden sm:block">Real-time data monitoring and prediction system</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search regions..." 
            className="pl-9 pr-4 py-2 rounded-full border border-border bg-card text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-muted-foreground">Department of Energy</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
