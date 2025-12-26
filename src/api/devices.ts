import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callApi } from "./client";

export type Device = {
  hostname: string;
  id: number;
};

export type PutDevice = Omit<Device, "id">;

export function createDevicesOptions() {
  return {
    queryKey: ["devices"],
    queryFn: () => callApi<Device[]>("monitored_devices"),
  };
}

export function useDevices() {
  return useQuery(createDevicesOptions());
}

export function usePutDevice(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: PutDevice) =>
      callApi("monitored_devices", {
        method: "PUT",
        body: JSON.stringify(variables),
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createDevicesOptions().queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useDeleteDevice(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      callApi(`monitored_devices/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createDevicesOptions().queryKey,
      });
      onSuccess?.();
    },
  });
}
