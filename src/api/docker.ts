import { useQueries } from "@tanstack/react-query";
import { useDevices } from "./devices";
import { createStatusOptions } from "./status";
import { API_HOST } from "./config.";

export function useContainers() {
  const { data: devices } = useDevices();

  return useQueries({
    queries: [{ hostname: API_HOST }, ...(devices ?? [])].map(({ hostname }) =>
      createStatusOptions(hostname),
    ),
  });
}
