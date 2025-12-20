import React from "react";
import { useDeleteTodo, usePutTodo, useTodos } from "../api/todo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { API_HOST } from "../api/config.";

export function TodoSection() {
  const [content, setContent] = React.useState("");
  const { data } = useTodos(API_HOST);
  const { mutate: createTodo } = usePutTodo();
  const { mutate: deleteTodo } = useDeleteTodo();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    createTodo({ hostname: API_HOST, data: { content } });
    setContent("");

    return false;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>To Do</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Loader className="animate-spin mx-auto mb-4" />
        ) : data.length ? (
          data?.map((todo) => (
            <div key={todo.id} className="mb-2 flex gap-2 justify-between">
              <span>{todo.content}</span>
              <Button
                size="icon"
                variant="ghost"
                className="ml-2 p-0.5 float-right relative bottom-1.5"
                onClick={() => deleteTodo({ hostname: API_HOST, id: todo.id })}
              >
                <Check />
              </Button>
            </div>
          ))
        ) : (
          <div className="py-2 text-gray-300">Empty, add new todo?</div>
        )}
        <form onSubmit={submit}>
          <InputGroup>
            <InputGroupTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="New todo..."
            />
            <InputGroupAddon align="block-end" className="flex-row-reverse">
              <InputGroupButton variant="outline" size="icon-xs" type="submit">
                <Plus />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </CardContent>
    </Card>
  );
}
