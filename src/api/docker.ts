import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useDevices } from "./devices";
import { createStatusOptions } from "./status";
import { API_HOST } from "./config.";
import { callApi } from "./client";

export function useContainers() {
  const { data: devices } = useDevices();

  return useQueries({
    queries: [{ hostname: API_HOST }, ...(devices ?? [])].map(({ hostname }) =>
      createStatusOptions(hostname),
    ),
  });
}

type ContainerAction = "start" | "stop" | "restart";

export function useContainerAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      host,
      containerId,
      action,
    }: {
      host: string;
      containerId: string;
      action: ContainerAction;
    }) => callApi(`docker/${containerId}/${action}`, { host, method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}
