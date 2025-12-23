import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { EvStat, Forecast } from "@shared/schema";

interface AdoptionTrendChartProps {
  historical: EvStat[];
  forecast: Forecast[];
}

export function AdoptionTrendChart({ historical, forecast }: AdoptionTrendChartProps) {
  // Combine data for display
  // This is a simplified merge, robust apps might group by year better
  const data = [
    ...historical.map(h => ({ year: h.year, type: 'Historical', count: h.count, demand: h.chargingDemandKwh })),
    ...forecast.map(f => ({ year: f.year, type: 'Forecast', count: f.predictedCount, demand: f.predictedDemandKwh }))
  ].sort((a, b) => a.year - b.year);

  // Group by year to handle overlapping series if needed, but for simple visualization:
  // We'll trust the sort for now. Real-world might need complex reduction.

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="year" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value / 1000}k`} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="EV Count"
            stroke="hsl(var(--primary))" 
            fillOpacity={1} 
            fill="url(#colorCount)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DemandChartProps {
  data: (EvStat | Forecast)[];
}

export function DemandChart({ data }: DemandChartProps) {
  // Normalize data keys
  const chartData = data.map(item => ({
    year: item.year,
    demand: 'chargingDemandKwh' in item ? item.chargingDemandKwh : item.predictedDemandKwh
  })).sort((a, b) => a.year - b.year);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="year" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value / 1000}MWh`}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
          />
          <Legend />
          <Bar 
            dataKey="demand" 
            name="Charging Demand (kWh)" 
            fill="hsl(var(--accent))" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
