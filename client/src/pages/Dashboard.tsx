import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { ForecastForm } from "@/components/ForecastForm";
import { AdoptionTrendChart, DemandChart } from "@/components/Charts";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useStats } from "@/hooks/use-stats";
import { useForecasts } from "@/hooks/use-forecasts";
import { useRegions } from "@/hooks/use-regions";
import { Car, Zap, TrendingUp, MapPin, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: regions } = useRegions();
  
  // Filter queries
  const filters = {
    region: selectedRegion === "All" ? undefined : selectedRegion,
    evType: selectedType === "All" ? undefined : selectedType
  };

  const { data: historicalStats, isLoading: historyLoading } = useStats(filters);
  const { data: forecasts, isLoading: forecastsLoading } = useForecasts(filters);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <Header title="Dashboard" />

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-border">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mr-4">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="All">All Regions</option>
                {regions?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="All">All EV Types</option>
                <option value="BEV">BEV (Battery Electric)</option>
                <option value="PHEV">PHEV (Plug-in Hybrid)</option>
              </select>
            </div>
            
            <span className="text-xs text-muted-foreground ml-auto">
              Showing data for <span className="font-semibold text-foreground">{selectedRegion}</span> • <span className="font-semibold text-foreground">{selectedType}</span>
            </span>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={itemVariants}>
                <StatsCard 
                  title="Total EV Adoption" 
                  value={statsLoading ? "..." : dashboardStats?.totalEvs.toLocaleString() || 0}
                  icon={<Car className="w-6 h-6" />}
                  trend={dashboardStats?.growthRate}
                  trendLabel="Annual Growth"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard 
                  title="Est. Charging Demand" 
                  value={statsLoading ? "..." : `${((dashboardStats?.totalDemand || 0) / 1000000).toFixed(1)} GWh`}
                  icon={<Zap className="w-6 h-6" />}
                  trend={12}
                  trendLabel="vs forecast"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard 
                  title="Leading Region" 
                  value={statsLoading ? "..." : dashboardStats?.topRegion || "N/A"}
                  icon={<MapPin className="w-6 h-6" />}
                  className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard 
                  title="Forecast Accuracy" 
                  value="94.2%" 
                  icon={<TrendingUp className="w-6 h-6" />}
                  trend={2.1}
                  trendLabel="Model confidence"
                />
              </motion.div>
            </div>

            {/* Main Charts & Forecasting Tool */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                <div className="dashboard-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-lg">EV Adoption Trends & Forecast</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">Historical</span>
                      <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded">Forecast</span>
                    </div>
                  </div>
                  {(historyLoading || forecastsLoading) ? (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading charts...</div>
                  ) : (
                    <AdoptionTrendChart 
                      historical={historicalStats || []} 
                      forecast={forecasts || []} 
                    />
                  )}
                </div>

                <div className="dashboard-card p-6">
                  <h3 className="font-display font-bold text-lg mb-6">Projected Charging Demand (kWh)</h3>
                  {(historyLoading || forecastsLoading) ? (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading charts...</div>
                  ) : (
                    <DemandChart data={[...(historicalStats || []), ...(forecasts || [])]} />
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <ForecastForm />
                
                <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-xl p-6 border border-secondary/20">
                  <h4 className="font-bold text-secondary mb-2">Did you know?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on current adoption rates, {dashboardStats?.topRegion} is on track to reach 50% EV saturation by 2032, requiring a 240% increase in public charging infrastructure.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
