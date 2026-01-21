import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callApi } from "./client";

export type WeatherData = {
  city: string;
  country: string;
  state: string;
  id: number;
  openweathermap_id: number;
  temperature: number;
  description: string;
};

export function createWeatherOptions() {
  return {
    queryKey: ["weather"],
    queryFn: () => callApi<WeatherData[]>("weather"),
  };
}

export function useWeather() {
  return useQuery(createWeatherOptions());
}

export type PutCity = {
  name: string;
};

export function usePutCity(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { data: PutCity }) =>
      callApi("weather", {
        method: "PUT",
        body: JSON.stringify(variables.data),
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createWeatherOptions().queryKey,
        refetchType: "all",
      });
      onSuccess?.();
    },
  });
}

export function useDeleteCity(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: number }) =>
      callApi(`weather/${encodeURIComponent(variables.id)}`, {
        method: "DELETE",
      }),
    onSuccess: (_data) => {
      client.invalidateQueries({
        queryKey: createWeatherOptions().queryKey,
        refetchType: "all",
      });
      onSuccess?.();
    },
  });
}
