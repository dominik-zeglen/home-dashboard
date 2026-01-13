import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_HOST } from "./config.";
import { callApi } from "./client";

export function createPinnedServicesOptions() {
  return {
    queryKey: ["services_pinned"],
    queryFn: () =>
      callApi("services/pinned") as Promise<{ host: string; name: string }[]>,
  };
}

export function usePinnedServices() {
  return useQuery(createPinnedServicesOptions());
}

export type SystemdUnit = {
  name: string;
  state: string;
  sub_state: string;
  description: string;
};

export type SystemdUnitsResponse = SystemdUnit[];

function createServicesOptions(hostname: string) {
  return {
    queryKey: ["services", hostname],
    queryFn: () =>
      fetch(`http://${hostname}/api/services`).then(
        (res) => res.json() as Promise<SystemdUnitsResponse>,
      ),
  };
}

export function useSystemdUnits() {
  return useQuery(createServicesOptions(API_HOST));
}

export function createAllSystemdUnitsOptions(bust = false) {
  return {
    queryKey: ["services"],
    queryFn: () =>
      callApi(`services/all?bust=${bust}`) as Promise<
        Array<SystemdUnit & { host: string }>
      >,
  };
}

export function useAllSystemdUnits() {
  return useQuery(createAllSystemdUnitsOptions());
}

export function useAllSystemdUnitsBust() {
  return useQuery({
    ...createAllSystemdUnitsOptions(true),
    refetchOnMount: false,
  });
}

export function usePinService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, host }: { name: string; host: string }) =>
      callApi(`services/pin`, {
        method: "POST",
        body: JSON.stringify({ name, host }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["services_pinned"],
      });
    },
  });
}

export function useUnpinService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, host }: { name: string; host: string }) =>
      callApi(`services/unpin`, {
        method: "POST",
        body: JSON.stringify({ name, host }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["services_pinned"],
      });
    },
  });
}
