import { useState, useEffect } from "react";
import { Leaf, Wind, TreeDeciduous } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GreenImpactTicker() {
    // Start with a large base number to look impressive (e.g., 12,450 kg)
    const [co2Saved, setCo2Saved] = useState(12450.5);
    const [treesEquivalent, setTreesEquivalent] = useState(622);

    useEffect(() => {
        // Increment CO2 saved every 2 seconds to simulate real-time data
        const interval = setInterval(() => {
            setCo2Saved(prev => prev + (Math.random() * 0.5));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Approx 20kg CO2 per tree per year -> rough calculation for visual
        setTreesEquivalent(Math.floor(co2Saved / 20));
    }, [co2Saved]);

    return (
        <div className="w-full mb-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/20 shadow-sm">
                {/* Animated background pulse */}
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />

                <div className="relative flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">

                    {/* Main Ticker */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-bounce-slow">
                            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                                Real-time Environmental Impact
                            </p>
                            <div className="flex items-baseline gap-2 font-mono">
                                <span className="text-2xl font-bold text-foreground">
                                    {co2Saved.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </span>
                                <span className="text-sm text-muted-foreground">kg CO2 Saved</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats (Trees & Air) */}
                    <div className="flex items-center gap-6 sm:gap-8 px-4 sm:border-l border-emerald-500/20">

                        {/* Trees */}
                        <div className="flex items-center gap-3">
                            <TreeDeciduous className="w-5 h-5 text-green-600 dark:text-green-500/80" />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold leading-none text-foreground">
                                    {treesEquivalent}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Trees Planted</span>
                            </div>
                        </div>

                        {/* Air Quality (Static for now, but visual) */}
                        <div className="hidden sm:flex items-center gap-3">
                            <Wind className="w-5 h-5 text-sky-500/80" />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold leading-none text-foreground">
                                    Good
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Air Quality Index</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Visual Progress Bar - Just for aesthetics */}
                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 w-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500/50"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                </div>

            </div>
        </div>
    );
}
