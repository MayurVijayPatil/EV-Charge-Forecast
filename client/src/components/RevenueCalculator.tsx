import { useState, useEffect } from "react";
import { Calculator, IndianRupee, Leaf, Zap, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RevenueCalculator() {
    const [numChargers, setNumChargers] = useState<number>(5);
    const [chargerType, setChargerType] = useState<"ac_slow" | "dc_fast">("dc_fast");
    const [utilization, setUtilization] = useState<number>(4); // Hours per day
    const [results, setResults] = useState({
        monthlyRevenue: 0,
        co2Saved: 0,
        dailyEnergy: 0
    });

    // India Market Assumptions
    const AC_POWER_KW = 7.4;  // Standard Type 2 AC
    const DC_POWER_KW = 50;   // Standard DC Fast
    const RATE_PER_UNIT = 18; // Selling Price ₹/kWh (Avg Public Charging)
    const COST_PER_UNIT = 9;  // Cost ₹/kWh (Commercial Grid Rate)
    const MARGIN_PER_UNIT = RATE_PER_UNIT - COST_PER_UNIT;

    useEffect(() => {
        calculateROI();
    }, [numChargers, chargerType, utilization]);

    const calculateROI = () => {
        const power = chargerType === "dc_fast" ? DC_POWER_KW : AC_POWER_KW;

        // Daily Energy = Chargers * kW * Hours
        const dailyKwh = numChargers * power * utilization;

        // Monthly Revenue (Profit Margin) = Daily kWh * 30 days * Margin
        // We calculate Revenue as Net Profit Potential here for better impact, or Gross Revenue?
        // User asked "Estimated Monthly Revenue". Usually means Gross or Net. 
        // Let's show Gross Revenue for bigger numbers, but maybe clarify "Revenue Potential".
        // Actual Revenue = Units Sold * Rate.
        const monthlyGrossRevenue = dailyKwh * 30 * RATE_PER_UNIT;

        // CO2 Savings: ~0.7kg per kWh displaced (India Grid Factor avg)
        const monthlyCo2 = dailyKwh * 30 * 0.7;

        setResults({
            monthlyRevenue: monthlyGrossRevenue,
            co2Saved: monthlyCo2,
            dailyEnergy: dailyKwh
        });
    };

    return (
        <Card className="border-border shadow-sm bg-gradient-to-br from-card to-muted/20 overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calculator className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Business ROI Planner</CardTitle>
                        <CardDescription>Estimate earnings from your EV infrastructure</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="grid lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Number of Chargers to Install</Label>
                        <div className="flex items-center gap-4">
                            <Slider
                                value={[numChargers]}
                                onValueChange={(val) => setNumChargers(val[0])}
                                max={50}
                                step={1}
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                value={numChargers}
                                onChange={(e) => setNumChargers(Number(e.target.value))}
                                className="w-20 text-center font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Charger Type</Label>
                        <Select value={chargerType} onValueChange={(val: any) => setChargerType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dc_fast">DC Fast Charger (50 kW)</SelectItem>
                                <SelectItem value="ac_slow">AC Standard Charger (7.4 kW)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            {chargerType === "dc_fast" ? "Best for highways & malls (High Volume)" : "Best for offices & apartments (Long Dwell)"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Daily Utilization (Hours/Day)</Label>
                        <div className="flex items-center gap-4">
                            <Slider
                                value={[utilization]}
                                onValueChange={(val) => setUtilization(val[0])}
                                max={24}
                                step={0.5}
                                className="flex-1"
                            />
                            <span className="w-20 text-center font-mono text-sm bg-muted py-1.5 rounded-md border border-border">
                                {utilization} hrs
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Average public charger usage in India is 3-5 hours daily.</p>
                    </div>
                </div>

                {/* Results */}
                <div className="flex flex-col gap-4 justify-center">

                    {/* Revenue Card */}
                    <motion.div
                        layout
                        key={results.monthlyRevenue}
                        initial={{ scale: 0.95, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-card border border-primary/20 rounded-xl p-5 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <IndianRupee className="w-24 h-24" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Monthly Revenue</p>
                        <h3 className="text-3xl font-bold text-primary tracking-tight">
                            ₹ {results.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium bg-green-500/10 w-fit px-2 py-1 rounded">
                            <TrendingUp className="w-3 h-3" />
                            Based on ₹18/kWh tariff
                        </p>
                    </motion.div>

                    {/* CO2 Card */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Leaf className="w-24 h-24 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Environmental Impact</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                                {results.co2Saved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h3>
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium">kg CO₂ / mo</span>
                        </div>
                        <p className="text-xs text-emerald-600/80 mt-2">
                            Equivalent to planting <strong>{Math.floor(results.co2Saved / 20)} trees</strong> every month.
                        </p>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
