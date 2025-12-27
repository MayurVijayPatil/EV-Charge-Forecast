import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Zap, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function GridImpact() {
    const [selectedRegion, setSelectedRegion] = useState<string>("All");

    // Fetch grid impact analysis
    const { data: gridData, isLoading } = useQuery({
        queryKey: ["/api/grid/analysis", selectedRegion],
        queryFn: async () => {
            const res = await fetch(`/api/grid/analysis?region=${selectedRegion === "All" ? "" : selectedRegion}`);
            if (!res.ok) throw new Error("Failed to fetch grid analysis");
            return res.json();
        },
    });

    // Fetch regions for filter
    const { data: regions } = useQuery({
        queryKey: ["/api/regions"],
        queryFn: async () => {
            const res = await fetch("/api/regions");
            if (!res.ok) throw new Error("Failed to fetch regions");
            return res.json();
        },
    });

    const summary = gridData?.summary || {};
    const costs = gridData?.costs || {};
    const peakHour = gridData?.peakHour || {};
    const hourlyProfile = gridData?.hourlyProfile || [];
    const recommendations = gridData?.recommendations || [];

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col">
                <Header title="Grid Impact Analysis" />

                <div className="flex-1 p-8 overflow-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                            Electrical Grid Impact Assessment
                        </h2>
                        <p className="text-muted-foreground">
                            Analyze peak demand, capacity constraints, and infrastructure upgrade requirements
                        </p>
                    </div>

                    {/* Region Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2">Select Region</label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
                        >
                            <option value="All">All Regions</option>
                            {regions?.map((region: string) => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                            <p className="mt-4 text-muted-foreground">Analyzing grid impact...</p>
                        </div>
                    ) : (
                        <>
                            {/* Key Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <MetricCard
                                    icon={<Zap className="w-6 h-6" />}
                                    title="Peak Demand"
                                    value={`${summary.peakDemandMw?.toFixed(1) || 0} MW`}
                                    subtitle={`${summary.peakDemandKw?.toLocaleString() || 0} kW`}
                                    color="text-blue-500"
                                />
                                <MetricCard
                                    icon={<TrendingUp className="w-6 h-6" />}
                                    title="Capacity Utilization"
                                    value={`${summary.capacityUtilization?.toFixed(1) || 0}%`}
                                    subtitle={summary.upgradeNeeded ? "Upgrade Needed" : "Sufficient"}
                                    color={summary.upgradeNeeded ? "text-red-500" : "text-green-500"}
                                />
                                <MetricCard
                                    icon={<DollarSign className="w-6 h-6" />}
                                    title="Infrastructure Cost"
                                    value={`$${(costs.totalInfrastructureCost / 1_000_000)?.toFixed(1) || 0}M`}
                                    subtitle={`${summary.substationsNeeded || 0} substations`}
                                    color="text-purple-500"
                                />
                                <MetricCard
                                    icon={<AlertTriangle className="w-6 h-6" />}
                                    title="Peak Hour"
                                    value={peakHour.timeRange || "N/A"}
                                    subtitle={`${peakHour.demandMw?.toFixed(1) || 0} MW`}
                                    color="text-orange-500"
                                />
                            </div>

                            {/* Hourly Demand Profile Chart */}
                            <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                <h3 className="text-xl font-bold mb-4">24-Hour Demand Profile</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={hourlyProfile}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="hour" label={{ value: "Hour of Day", position: "insideBottom", offset: -5 }} />
                                        <YAxis label={{ value: "Demand (MW)", angle: -90, position: "insideLeft" }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                            labelFormatter={(value) => `${value}:00`}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="demandMw" stroke="#3b82f6" strokeWidth={2} name="Demand (MW)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                <h3 className="text-xl font-bold mb-4">Infrastructure Cost Breakdown</h3>
                                <div className="space-y-4">
                                    <CostItem
                                        label="Transformer Upgrades"
                                        value={`$${(costs.transformerUpgradeCost / 1_000_000)?.toFixed(2) || 0}M`}
                                        description={`${summary.substationsNeeded || 0} units @ $1M each`}
                                    />
                                    <CostItem
                                        label="Total Infrastructure Investment"
                                        value={`$${(costs.totalInfrastructureCost / 1_000_000)?.toFixed(2) || 0}M`}
                                        description="Including substations and grid reinforcement"
                                    />
                                    <CostItem
                                        label="Cost Per EV"
                                        value={`$${costs.costPerEv?.toFixed(2) || 0}`}
                                        description="Infrastructure cost amortized per vehicle"
                                    />
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-4">Actionable Recommendations</h3>
                                <div className="space-y-4">
                                    {recommendations.map((rec: any, idx: number) => (
                                        <RecommendationCard key={idx} recommendation={rec} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function MetricCard({ icon, title, value, subtitle, color }: any) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className={`${color} mb-3`}>{icon}</div>
            <div className="text-sm text-muted-foreground mb-1">{title}</div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
    );
}

function CostItem({ label, value, description }: any) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
            <div>
                <div className="font-semibold">{label}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
            </div>
            <div className="text-lg font-bold text-primary">{value}</div>
        </div>
    );
}

function RecommendationCard({ recommendation }: any) {
    const priorityColors = {
        HIGH: "bg-red-500/10 border-red-500/50 text-red-500",
        MEDIUM: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500",
        LOW: "bg-green-500/10 border-green-500/50 text-green-500",
    };

    const priorityIcons = {
        HIGH: <AlertTriangle className="w-5 h-5" />,
        MEDIUM: <Info className="w-5 h-5" />,
        LOW: <CheckCircle className="w-5 h-5" />,
    };

    const colorClass = priorityColors[recommendation.priority as keyof typeof priorityColors] || priorityColors.MEDIUM;
    const icon = priorityIcons[recommendation.priority as keyof typeof priorityIcons] || priorityIcons.MEDIUM;

    return (
        <div className={`border rounded-lg p-4 ${colorClass}`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-background/50">
                            {recommendation.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">{recommendation.category}</span>
                    </div>
                    <div className="font-semibold mb-1">{recommendation.recommendation}</div>
                    <div className="text-sm opacity-90">{recommendation.action}</div>
                </div>
            </div>
        </div>
    );
}
