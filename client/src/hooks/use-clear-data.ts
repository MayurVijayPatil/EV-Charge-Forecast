import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useClearAllData() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch(api.stats.clearAll.path, {
                method: api.stats.clearAll.method,
            });

            if (!res.ok) {
                throw new Error("Failed to clear data");
            }

            return res.json();
        },
        onSuccess: () => {
            // Invalidate all queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: [api.stats.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.regions.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
            queryClient.invalidateQueries({ queryKey: [api.forecasts.list.path] });
        },
    });
}
