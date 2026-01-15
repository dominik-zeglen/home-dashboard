import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callApi } from "./client";

export function createTodosOptions(hostname: string) {
  return {
    queryKey: ["todos", hostname],
    queryFn: () =>
      callApi("todos").then(
        (res: { id: number; content: string; created_at: string }[]) =>
          res.map((todo) => ({
            ...todo,
            created_at: new Date(todo.created_at).getTime(),
          })),
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
