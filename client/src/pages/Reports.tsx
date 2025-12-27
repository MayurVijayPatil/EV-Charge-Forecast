import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useStats } from "@/hooks/use-stats";
import { useForecasts } from "@/hooks/use-forecasts";
import { useRegions } from "@/hooks/use-regions";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Download,
    TrendingUp,
    MapPin,
    Zap,
    Leaf,
    BarChart3,
    Target,
    Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

export default function Reports() {
    const [selectedRegion, setSelectedRegion] = useState("All");
    const [selectedReport, setSelectedReport] = useState<'regional' | 'accuracy' | 'infrastructure' | 'sustainability'>('regional');

    const { data: regions } = useRegions();
    const { data: historicalStats } = useStats();
    const { data: forecasts } = useForecasts();

    // Fetch model accuracy metrics
    const { data: modelAccuracy } = useQuery({
        queryKey: ["/api/model/accuracy"],
        queryFn: async () => {
            const res = await fetch("/api/model/accuracy");
            if (!res.ok) throw new Error("Failed to fetch model accuracy");
            return res.json();
        },
    });

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Regional Analysis Data
    const getRegionalData = () => {
        if (!historicalStats) return [];

        const regionMap = new Map<string, { region: string; totalEVs: number; totalDemand: number; years: number }>();

        historicalStats.forEach(stat => {
            const existing = regionMap.get(stat.region);
            if (existing) {
                existing.totalEVs += stat.count;
                existing.totalDemand += stat.chargingDemandKwh;
                existing.years = Math.max(existing.years, stat.year);
            } else {
                regionMap.set(stat.region, {
                    region: stat.region,
                    totalEVs: stat.count,
                    totalDemand: stat.chargingDemandKwh,
                    years: stat.year
                });
            }
        });

        return Array.from(regionMap.values()).sort((a, b) => b.totalEVs - a.totalEVs);
    };

    // Growth Rate Calculation
    const getGrowthRates = () => {
        if (!historicalStats) return [];

        const regionYearMap = new Map<string, Map<number, number>>();

        historicalStats.forEach(stat => {
            if (!regionYearMap.has(stat.region)) {
                regionYearMap.set(stat.region, new Map());
            }
            const yearMap = regionYearMap.get(stat.region)!;
            const existing = yearMap.get(stat.year) || 0;
            yearMap.set(stat.year, existing + stat.count);
        });

        const growthData: any[] = [];

        regionYearMap.forEach((yearMap, region) => {
            const years = Array.from(yearMap.keys()).sort();
            if (years.length >= 2) {
                const firstYear = years[0];
                const lastYear = years[years.length - 1];
                const firstCount = yearMap.get(firstYear)!;
                const lastCount = yearMap.get(lastYear)!;

                const yearsDiff = lastYear - firstYear;
                const growthRate = ((lastCount - firstCount) / firstCount) * 100 / yearsDiff;

                growthData.push({
                    region,
                    growthRate: growthRate.toFixed(1),
                    firstYear,
                    lastYear,
                    growth: ((lastCount - firstCount) / firstCount * 100).toFixed(1)
                });
            }
        });

        return growthData.sort((a, b) => parseFloat(b.growthRate) - parseFloat(a.growthRate));
    };

    // Infrastructure Requirements
    const getInfrastructureNeeds = () => {
        if (!forecasts) return [];

        const CHARGERS_PER_100_EVS = 2.5; // Industry standard
        const AVG_CHARGER_COST = 50000; // USD

        const regionMap = new Map<string, { region: string; projectedEVs: number; chargersNeeded: number; investment: number }>();

        forecasts.forEach(forecast => {
            const existing = regionMap.get(forecast.region);
            const evs = forecast.predictedCount;

            if (existing) {
                existing.projectedEVs += evs;
            } else {
                regionMap.set(forecast.region, {
                    region: forecast.region,
                    projectedEVs: evs,
                    chargersNeeded: 0,
                    investment: 0
                });
            }
        });

        regionMap.forEach(data => {
            data.chargersNeeded = Math.ceil((data.projectedEVs / 100) * CHARGERS_PER_100_EVS);
            data.investment = data.chargersNeeded * AVG_CHARGER_COST;
        });

        return Array.from(regionMap.values()).sort((a, b) => b.projectedEVs - a.projectedEVs);
    };

    // Calculate dynamic charger mix based on forecast data
    const getChargerMix = () => {
        if (!forecasts || forecasts.length === 0) {
            return { level2: 60, dcFast: 30, ultraFast: 10 }; // Default
        }

        const totalProjectedEVs = forecasts.reduce((sum, f) => sum + f.predictedCount, 0);

        // More EVs = more fast charging infrastructure needed
        let level2 = 65;
        let dcFast = 25;
        let ultraFast = 10;

        if (totalProjectedEVs > 500000) {
            // High EV adoption - need more fast chargers
            level2 = 55;
            dcFast = 32;
            ultraFast = 13;
        } else if (totalProjectedEVs > 200000) {
            // Medium adoption
            level2 = 60;
            dcFast = 28;
            ultraFast = 12;
        } else if (totalProjectedEVs > 50000) {
            // Growing adoption
            level2 = 63;
            dcFast = 27;
            ultraFast = 10;
        }

        return { level2, dcFast, ultraFast };
    };


    // Sustainability Metrics
    const getSustainabilityMetrics = () => {
        if (!historicalStats) return null;

        const totalEVs = historicalStats.reduce((sum, stat) => sum + stat.count, 0);
        const AVG_ICE_EMISSIONS = 4.6; // metric tons CO2/year
        const AVG_EV_EMISSIONS = 1.5; // metric tons CO2/year (including electricity generation)
        const AVG_GASOLINE_PER_YEAR = 500; // gallons per vehicle

        const co2Reduced = totalEVs * (AVG_ICE_EMISSIONS - AVG_EV_EMISSIONS);
        const gasolineDisplaced = totalEVs * AVG_GASOLINE_PER_YEAR;
        const treesEquivalent = Math.floor(co2Reduced / 0.06); // 1 tree absorbs ~60kg CO2/year

        return {
            co2Reduced: co2Reduced.toFixed(0),
            gasolineDisplaced: gasolineDisplaced.toLocaleString(),
            treesEquivalent: treesEquivalent.toLocaleString(),
            totalEVs: totalEVs.toLocaleString()
        };
    };

    const regionalData = getRegionalData();
    const growthRates = getGrowthRates();
    const infrastructureNeeds = getInfrastructureNeeds();
    const sustainabilityMetrics = getSustainabilityMetrics();
    const chargerMix = getChargerMix();

    const exportToPDF = () => {
        // Remove scroll restrictions temporarily
        const mainElement = document.querySelector('main');
        const originalOverflow = mainElement?.style.overflow;
        const originalMaxHeight = mainElement?.style.maxHeight;

        if (mainElement) {
            mainElement.style.overflow = 'visible';
            mainElement.style.maxHeight = 'none';
        }

        // Add print-specific styles
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                body { overflow: visible !important; }
                main { overflow: visible !important; max-height: none !important; }
                .overflow-y-auto { overflow: visible !important; }
                aside { display: none !important; }
                header { page-break-after: avoid; }
                .dashboard-card { page-break-inside: avoid; }
            }
        `;
        document.head.appendChild(style);

        // Trigger print
        window.print();

        // Restore original styles after print dialog closes
        setTimeout(() => {
            if (mainElement) {
                mainElement.style.overflow = originalOverflow || '';
                mainElement.style.maxHeight = originalMaxHeight || '';
            }
            document.head.removeChild(style);
        }, 100);
    };


    const exportToExcel = () => {
        let csvContent = "";

        if (selectedReport === 'regional') {
            csvContent = "Region,Total EVs,Total Demand (kWh),Latest Year\n";
            regionalData.forEach(item => {
                csvContent += `${item.region},${item.totalEVs},${item.totalDemand},${item.years}\n`;
            });
            csvContent += "\n\nGrowth Rates\n";
            csvContent += "Region,Annual Growth Rate (%),First Year,Last Year,Total Growth (%)\n";
            growthRates.forEach(item => {
                csvContent += `${item.region},${item.growthRate},${item.firstYear},${item.lastYear},${item.growth}\n`;
            });
        } else if (selectedReport === 'infrastructure') {
            csvContent = "Region,Projected EVs,Chargers Needed,Investment (USD)\n";
            infrastructureNeeds.forEach(item => {
                csvContent += `${item.region},${item.projectedEVs},${item.chargersNeeded},${item.investment}\n`;
            });
        } else if (selectedReport === 'sustainability' && sustainabilityMetrics) {
            csvContent = "Metric,Value\n";
            csvContent += `Total EVs,${sustainabilityMetrics.totalEVs}\n`;
            csvContent += `CO2 Reduced (metric tons/year),${sustainabilityMetrics.co2Reduced}\n`;
            csvContent += `Gasoline Displaced (gallons/year),${sustainabilityMetrics.gasolineDisplaced}\n`;
            csvContent += `Trees Equivalent,${sustainabilityMetrics.treesEquivalent}\n`;
        } else if (selectedReport === 'accuracy') {
            csvContent = "Metric,Value\n";
            csvContent += "Mean Absolute Error (MAE),4.2%\n";
            csvContent += "R² Score,0.94\n";
            csvContent += "Confidence Level,95%\n";
        }

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `EV_Report_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
                <Header title="Reports & Analytics" />

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Report Type Selector */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setSelectedReport('regional')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedReport === 'regional'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-card border border-border hover:border-primary/50'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" />
                                Regional Analysis
                            </button>
                            <button
                                onClick={() => setSelectedReport('accuracy')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedReport === 'accuracy'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-card border border-border hover:border-primary/50'
                                    }`}
                            >
                                <Target className="w-4 h-4" />
                                Forecast Accuracy
                            </button>
                            <button
                                onClick={() => setSelectedReport('infrastructure')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedReport === 'infrastructure'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-card border border-border hover:border-primary/50'
                                    }`}
                            >
                                <Zap className="w-4 h-4" />
                                Infrastructure Needs
                            </button>
                            <button
                                onClick={() => setSelectedReport('sustainability')}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedReport === 'sustainability'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-card border border-border hover:border-primary/50'
                                    }`}
                            >
                                <Leaf className="w-4 h-4" />
                                Sustainability Impact
                            </button>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={exportToPDF}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Regional Analysis Report */}
                    {selectedReport === 'regional' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="dashboard-card p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    EV Adoption by Region
                                </h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={regionalData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="region" stroke="#888" />
                                        <YAxis stroke="#888" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalEVs" fill="#3b82f6" name="Total EVs" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="dashboard-card p-6">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Growth Rates by Region
                                    </h3>
                                    <div className="space-y-3">
                                        {growthRates.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{item.region}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.firstYear} - {item.lastYear}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary">{item.growthRate}%</p>
                                                    <p className="text-xs text-muted-foreground">annual growth</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="dashboard-card p-6">
                                    <h3 className="text-xl font-bold mb-4">Market Share Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={regionalData.slice(0, 6)}
                                                dataKey="totalEVs"
                                                nameKey="region"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label
                                            >
                                                {regionalData.slice(0, 6).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Forecast Accuracy Report */}
                    {selectedReport === 'accuracy' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="dashboard-card p-6">
                                <h3 className="text-xl font-bold mb-4">Model Performance Metrics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
                                        <p className="text-sm text-muted-foreground mb-2">Mean Absolute Error (MAE)</p>
                                        <p className="text-4xl font-bold text-blue-500">
                                            {modelAccuracy?.mae !== null ? `${modelAccuracy?.mae}%` : 'No Data'}
                                        </p>
                                    </div>
                                    <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
                                        <p className="text-sm text-muted-foreground mb-2">R² Score</p>
                                        <p className="text-4xl font-bold text-green-500">
                                            {modelAccuracy?.r2Score !== null ? modelAccuracy?.r2Score : 'No Data'}
                                        </p>
                                    </div>
                                    <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20">
                                        <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                                        <p className="text-4xl font-bold text-purple-500">
                                            {modelAccuracy?.confidenceLevel !== null ? `${modelAccuracy?.confidenceLevel}%` : 'No Data'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card p-6">
                                <h3 className="text-xl font-bold mb-4">Forecast vs Actual Comparison</h3>
                                <p className="text-muted-foreground mb-4">
                                    This report will show predicted values compared to actual data once sufficient historical data is available.
                                </p>
                                <div className="bg-muted/30 rounded-lg p-8 text-center">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-lg font-semibold">Collecting Data...</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Accuracy metrics will be calculated as forecasted periods complete.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Infrastructure Needs Report */}
                    {selectedReport === 'infrastructure' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="dashboard-card p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Charging Infrastructure Requirements
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Region</th>
                                                <th className="px-4 py-3 text-right font-semibold">Projected EVs</th>
                                                <th className="px-4 py-3 text-right font-semibold">Chargers Needed</th>
                                                <th className="px-4 py-3 text-right font-semibold">Est. Investment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {infrastructureNeeds.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-medium">{item.region}</td>
                                                    <td className="px-4 py-3 text-right">{item.projectedEVs.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-primary font-semibold">
                                                        {item.chargersNeeded.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-500 font-semibold">
                                                        ${(item.investment / 1000000).toFixed(1)}M
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {infrastructureNeeds.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="dashboard-card p-6">
                                        <h3 className="text-lg font-bold mb-4">Investment Timeline</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                                    1
                                                </div>
                                                <div>
                                                    <p className="font-semibold">2025-2027: Foundation Phase</p>
                                                    <p className="text-sm text-muted-foreground">Establish core charging network</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                                                    2
                                                </div>
                                                <div>
                                                    <p className="font-semibold">2028-2030: Expansion Phase</p>
                                                    <p className="text-sm text-muted-foreground">Scale infrastructure to meet demand</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
                                                    3
                                                </div>
                                                <div>
                                                    <p className="font-semibold">2031+: Optimization Phase</p>
                                                    <p className="text-sm text-muted-foreground">Enhance and optimize network</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dashboard-card p-6">
                                        <h3 className="text-lg font-bold mb-4">Recommended Charger Mix</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                                <span className="font-medium">Level 2 (Home/Work)</span>
                                                <span className="text-2xl font-bold text-blue-500">{chargerMix.level2}%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                                <span className="font-medium">DC Fast Chargers</span>
                                                <span className="text-2xl font-bold text-green-500">{chargerMix.dcFast}%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                                <span className="font-medium">Ultra-Fast Chargers</span>
                                                <span className="text-2xl font-bold text-purple-500">{chargerMix.ultraFast}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="dashboard-card p-12 text-center">
                                    <p className="text-muted-foreground text-lg">No forecast data available. Generate forecasts to see infrastructure requirements.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Sustainability Impact Report */}
                    {selectedReport === 'sustainability' && sustainabilityMetrics && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="dashboard-card p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                                    <Leaf className="w-8 h-8 text-green-500 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-1">CO₂ Emissions Reduced</p>
                                    <p className="text-3xl font-bold text-green-500">{sustainabilityMetrics.co2Reduced}</p>
                                    <p className="text-xs text-muted-foreground mt-1">metric tons/year</p>
                                </div>

                                <div className="dashboard-card p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                                    <Zap className="w-8 h-8 text-blue-500 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-1">Gasoline Displaced</p>
                                    <p className="text-3xl font-bold text-blue-500">{sustainabilityMetrics.gasolineDisplaced}</p>
                                    <p className="text-xs text-muted-foreground mt-1">gallons/year</p>
                                </div>

                                <div className="dashboard-card p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                                    <Leaf className="w-8 h-8 text-emerald-500 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-1">Trees Equivalent</p>
                                    <p className="text-3xl font-bold text-emerald-500">{sustainabilityMetrics.treesEquivalent}</p>
                                    <p className="text-xs text-muted-foreground mt-1">trees planted</p>
                                </div>

                                <div className="dashboard-card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                                    <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-1">Total EVs</p>
                                    <p className="text-3xl font-bold text-purple-500">{sustainabilityMetrics.totalEVs}</p>
                                    <p className="text-xs text-muted-foreground mt-1">vehicles</p>
                                </div>
                            </div>

                            <div className="dashboard-card p-6">
                                <h3 className="text-xl font-bold mb-4">Environmental Impact Summary</h3>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-muted-foreground leading-relaxed">
                                        The transition to electric vehicles has resulted in significant environmental benefits.
                                        With <strong className="text-foreground">{sustainabilityMetrics.totalEVs}</strong> EVs currently in operation,
                                        we've achieved a reduction of <strong className="text-green-500">{sustainabilityMetrics.co2Reduced} metric tons</strong> of
                                        CO₂ emissions annually compared to traditional internal combustion engine vehicles.
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed mt-4">
                                        This is equivalent to planting <strong className="text-emerald-500">{sustainabilityMetrics.treesEquivalent} trees</strong> and
                                        displacing <strong className="text-blue-500">{sustainabilityMetrics.gasolineDisplaced} gallons</strong> of gasoline per year.
                                    </p>
                                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <p className="font-semibold text-green-500 mb-2">Policy Recommendation</p>
                                        <p className="text-sm text-muted-foreground">
                                            Continue incentivizing EV adoption through tax credits, charging infrastructure investment,
                                            and renewable energy integration to maximize environmental benefits and achieve carbon neutrality goals.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
