import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { createStatusOptions } from "./status";
import { useDevices } from "./devices";
import { API_HOST } from "./config.";

export type PutService = {
  name: string;
  url?: string;
  sv_name: string;
};

export function usePutService(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { hostname: string; data: PutService }) =>
      fetch(`http://${variables.hostname}/api/service`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables.data),
      }),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: createStatusOptions(variables.hostname).queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useDeleteService(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { hostname: string; svName: string }) =>
      fetch(
        `http://${variables.hostname}/api/service/${encodeURIComponent(variables.svName)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: createStatusOptions(variables.hostname).queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useServices() {
  const { data: devices } = useDevices();

  return useQueries({
    queries: [{ hostname: API_HOST }, ...(devices ?? [])].map(({ hostname }) =>
      createStatusOptions(hostname),
    ),
  });
}
