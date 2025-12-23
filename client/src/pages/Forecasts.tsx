import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ForecastForm } from "@/components/ForecastForm";
import { useForecasts } from "@/hooks/use-forecasts";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ForecastsPage() {
  const { data: forecasts, isLoading } = useForecasts();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header title="Forecast Models" />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <ForecastForm />
                
                <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2">Model Information</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-500 leading-relaxed">
                    This system uses a hybrid forecasting model combining historical regression analysis with regional adoption curves.
                    Predictions are updated in real-time based on new data uploads.
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-6">
              <h2 className="text-xl font-display font-bold">Generated Forecasts</h2>
              
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Region</th>
                        <th className="px-6 py-4 font-semibold">Year</th>
                        <th className="px-6 py-4 font-semibold">EV Type</th>
                        <th className="px-6 py-4 font-semibold text-right">Predicted Count</th>
                        <th className="px-6 py-4 font-semibold text-right">Demand (kWh)</th>
                        <th className="px-6 py-4 font-semibold">Model</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading data...
                          </td>
                        </tr>
                      ) : forecasts?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            No forecasts generated yet. Use the form to run a simulation.
                          </td>
                        </tr>
                      ) : (
                        forecasts?.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-foreground">{item.region}</td>
                            <td className="px-6 py-4">{item.year}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.evType === 'BEV' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                                  : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
                              }`}>
                                {item.evType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono">{item.predictedCount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono">{item.predictedDemandKwh.toLocaleString()}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">{item.modelUsed}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
