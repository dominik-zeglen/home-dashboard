import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function createTodosOptions(hostname: string) {
  return {
    queryKey: ["todos", hostname],
    queryFn: () =>
      fetch(`http://${hostname}/api/todos`).then(
        (res) => res.json() as Promise<{ id: number; content: string }[]>,
      ),
  };
}

export function useTodos(hostname: string) {
  return useQuery(createTodosOptions(hostname));
}

export type PutTodo = {
  content: string;
};

export function usePutTodo(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { hostname: string; data: PutTodo }) =>
      fetch(`http://${variables.hostname}/api/todos`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables.data),
      }),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: createTodosOptions(variables.hostname).queryKey,
      });
      onSuccess?.();
    },
  });
}

export function useDeleteTodo(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (variables: { hostname: string; id: number }) =>
      fetch(
        `http://${variables.hostname}/api/todos/${encodeURIComponent(
          variables.id,
        )}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: createTodosOptions(variables.hostname).queryKey,
      });
      onSuccess?.();
    },
  });
}
