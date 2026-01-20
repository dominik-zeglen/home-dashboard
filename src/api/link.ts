import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callApi } from "./client";

export type Link = {
  name: string;
  url: string;
  id: number;
  icon?: string;
};

export type PutLink = Omit<Link, "id">;

export function createLinksOptions() {
  return {
    queryKey: ["links"],
    queryFn: () => callApi<Link[]>("link"),
  };
}

export function useLinks() {
  return useQuery(createLinksOptions());
}

export function usePutLink(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: PutLink) =>
      callApi("link", {
        method: "PUT",
        body: JSON.stringify(variables),
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createLinksOptions().queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useDeleteLink(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      callApi(`link/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createLinksOptions().queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useLinkOrder(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: number; index: number }) =>
      callApi("link/order", {
        method: "POST",
        body: JSON.stringify(variables),
      }),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: createLinksOptions().queryKey,
      });
      onSuccess?.();
    },
  });
}
