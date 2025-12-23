import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useRegions() {
  return useQuery({
    queryKey: [api.regions.list.path],
    queryFn: async () => {
      const res = await fetch(api.regions.list.path);
      if (!res.ok) throw new Error("Failed to fetch regions");
      return api.regions.list.responses[200].parse(await res.json());
    },
  });
}
