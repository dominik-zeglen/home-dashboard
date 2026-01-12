import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useDevices } from "./devices";
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

export function useAllSystemdUnits() {
  const { data: devices } = useDevices();

  return useQueries({
    queries: [{ hostname: API_HOST }, ...(devices ?? [])].map(({ hostname }) =>
      createServicesOptions(hostname),
    ),
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
