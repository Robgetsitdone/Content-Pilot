import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StrategySettings, InsertStrategySettings } from "@shared/schema";

async function fetchStrategy(): Promise<StrategySettings> {
  const response = await fetch("/api/strategy");
  if (!response.ok) {
    throw new Error("Failed to fetch strategy");
  }
  return response.json();
}

async function saveStrategy(settings: InsertStrategySettings): Promise<StrategySettings> {
  const response = await fetch("/api/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to save strategy");
  }
  return response.json();
}

export function useStrategy() {
  return useQuery({
    queryKey: ["strategy"],
    queryFn: fetchStrategy,
  });
}

export function useSaveStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy"] });
    },
  });
}
