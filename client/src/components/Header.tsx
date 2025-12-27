import { Bell, Search, User, LogOut, Settings, HelpCircle, Moon, Sun, Mail, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRegions } from "@/hooks/use-regions";
import { useLocation } from "wouter";
import { clsx } from "clsx";
import { useUser } from "@/hooks/use-user";

export function Header({ title }: { title: string }) {
  const { user, logout } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isDark, setIsDark] = useState(false);

  const [, setLocation] = useLocation();
  const { data: regions } = useRegions();

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initial Theme Check
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  // Theme Toggle Handler
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Dummy Notifications with state
  const [notifications, setNotifications] = useState([
    { id: 1, title: "High Demand Alert", desc: "Maharashtra region exceeding expected demand", time: "10 min ago", unread: true },
    { id: 2, title: "New Forecast Available", desc: "Q3 2025 forecast data generated", time: "2 hrs ago", unread: true },
    { id: 3, title: "System Maintenance", desc: "Scheduled for tonight at 2:00 AM", time: "5 hrs ago", unread: false },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const filteredRegions = regions?.filter(region =>
    region.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRegionSelect = (region: string) => {
    setSearchQuery("");
    setShowSuggestions(false);
    setLocation(`/?region=${encodeURIComponent(region)}`);
  };

  const displayName = user?.name || "Guest";
  const displayEmail = user?.email || "";

  return (
    <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-30 border-b border-border px-4 md:px-8 py-5 flex items-center justify-between shadow-sm">
      <div className="ml-10 md:ml-0">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm hidden sm:block">Real-time data monitoring and prediction system</p>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search regions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
            className="pl-9 pr-4 py-2 rounded-full border border-border bg-card text-sm w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          />

          {showSuggestions && filteredRegions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-xl overflow-hidden z-[100]">
              {filteredRegions.slice(0, 5).map((region) => (
                <button
                  key={region}
                  onClick={() => handleRegionSelect(region)}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm text-foreground"
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative" ref={notifRef}>
          <button
            className={clsx(
              "relative p-2 rounded-full transition-colors",
              showNotifications ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background shadow-sm"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className={clsx(
                      "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                      notif.unread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    )}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={clsx("text-sm font-semibold", notif.unread ? "text-primary dark:text-blue-400" : "text-foreground")}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{notif.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
              {unreadCount > 0 && (
                <div className="p-3 bg-muted/30 text-center border-t border-border">
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-primary hover:text-primary/80 hover:underline flex items-center justify-center gap-2 w-full"
                  >
                    <Check className="w-3 h-3" /> Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative pl-2 md:pl-4 border-l border-border" ref={profileRef}>
          <button
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold group-hover:text-primary transition-colors text-foreground">{displayName}</p>
              {displayEmail && <p className="text-xs text-muted-foreground">{displayEmail}</p>}
            </div>
            <div className={clsx(
              "w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-md transition-all",
              showProfileMenu ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900" : ""
            )}>
              <User className="w-5 h-5" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
              <div className="p-5 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground font-medium">{displayEmail}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">Administrator</span>
              </div>

              <div className="p-2 space-y-1">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Appearance</p>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                      <span>Theme</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>
                </div>

                <div className="h-px bg-border my-1 mx-2"></div>

                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Support</p>
                  <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2 mb-1 text-foreground">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">Need Help?</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-5.5">
                      Contact support at:
                      <a href="mailto:mayur2223p@gmail.com" className="block text-primary hover:underline font-medium mt-0.5">
                        mayur2223p@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 border-t border-border mt-1 bg-muted/20">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
