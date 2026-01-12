import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDevices } from "./devices";
import { API_HOST } from "./config.";
import { callApi } from "./client";

export type SystemdUnit = {
	name: string;
	state: string;
	sub_state: string;
	description: string;
	pinned: boolean;
};

export type SystemdUnitsResponse = {
	units: SystemdUnit[];
	total: number;
	page: number;
	pages: number;
};

export type SystemdQueryParams = {
	state?: string;
	search?: string;
	page?: number;
	limit?: number;
};

function createServicesOptions(hostname: string, params: SystemdQueryParams) {
	const searchParams = new URLSearchParams();
	if (params.state) searchParams.set("state", params.state);
	if (params.search) searchParams.set("search", params.search);
	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));

	return {
		queryKey: ["services", hostname, params],
		queryFn: () =>
			fetch(`http://${hostname}/api/services?${searchParams}`).then(
				(res) => res.json() as Promise<SystemdUnitsResponse>,
			),
		refetchInterval: 10000,
	};
}

export function useSystemdUnits(params: SystemdQueryParams = {}) {
	return useQuery(createServicesOptions(API_HOST, params));
}

export function useAllSystemdUnits(params: SystemdQueryParams = {}) {
	const { data: devices } = useDevices();

	return useQueries({
		queries: [{ hostname: API_HOST }, ...(devices ?? [])].map(({ hostname }) =>
			createServicesOptions(hostname, params),
		),
	});
}

export function usePinService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ name, pinned }: { name: string; pinned: boolean }) =>
			callApi(`services/pin/${encodeURIComponent(name)}`, {
				method: pinned ? "DELETE" : "PUT",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}
