import { useForm } from "react-hook-form";
import { useRegions } from "@/hooks/use-regions";
import { useGenerateForecast } from "@/hooks/use-forecasts";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";

// Assuming we want to use the schema from routes for type safety
const formSchema = api.forecasts.generate.input;
type FormData = z.infer<typeof formSchema>;

export function ForecastForm() {
  const { data: regions } = useRegions();
  const { mutate: generate, isPending } = useGenerateForecast();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      evType: "BEV",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
    }
  });

  const onSubmit = (data: FormData) => {
    generate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Forecast generated successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
          <Wand2 className="w-5 h-5" />
        </div>
        <h3 className="font-display font-bold text-lg">Generate New Forecast</h3>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Region</label>
          <select 
            {...form.register("region")} 
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Select Region</option>
            {regions?.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {form.formState.errors.region && <p className="text-xs text-destructive">{form.formState.errors.region.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">EV Type</label>
          <select 
            {...form.register("evType")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="BEV">Battery Electric Vehicle (BEV)</option>
            <option value="PHEV">Plug-in Hybrid (PHEV)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Year</label>
            <input 
              type="number" 
              {...form.register("startYear", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Year</label>
            <input 
              type="number" 
              {...form.register("endYear", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Simulation"}
        </button>
      </form>
    </div>
  );
}
