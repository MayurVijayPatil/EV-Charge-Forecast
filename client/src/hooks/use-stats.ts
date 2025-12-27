import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { EvStat } from "@shared/schema";

interface StatsFilters {
  region?: string;
  evType?: string;
}

export function useStats(filters?: StatsFilters) {
  // Construct query string manually for simplicity or use URLSearchParams
  const queryString = new URLSearchParams();
  if (filters?.region && filters.region !== "All") queryString.append("region", filters.region);
  if (filters?.evType && filters.evType !== "All") queryString.append("evType", filters.evType);

  const url = `${api.stats.list.path}?${queryString.toString()}`;

  return useQuery({
    queryKey: [api.stats.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch historical stats");
      return api.stats.list.responses[200].parse(await res.json());
    },
  });
}

export function useUploadStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      // Read file content as text
      const csvContent = await file.text();

      const res = await fetch(api.stats.upload.path, {
        method: api.stats.upload.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData: csvContent }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to upload stats");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.regions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
