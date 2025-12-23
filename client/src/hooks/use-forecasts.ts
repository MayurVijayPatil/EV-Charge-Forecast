import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type ForecastInput = z.infer<typeof api.forecasts.generate.input>;

export function useForecasts(filters?: { region?: string; evType?: string }) {
  const queryString = new URLSearchParams();
  if (filters?.region && filters.region !== "All") queryString.append("region", filters.region);
  if (filters?.evType && filters.evType !== "All") queryString.append("evType", filters.evType);

  const url = `${api.forecasts.list.path}?${queryString.toString()}`;

  return useQuery({
    queryKey: [api.forecasts.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch forecasts");
      return api.forecasts.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ForecastInput) => {
      const res = await fetch(api.forecasts.generate.path, {
        method: api.forecasts.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message);
        }
        throw new Error("Failed to generate forecast");
      }
      return api.forecasts.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forecasts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
