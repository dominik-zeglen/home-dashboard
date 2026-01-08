from microdot import Microdot, Request
from pydantic import BaseModel, Field
from tinydb import TinyDB, where


class Todo(BaseModel):
    content: str = Field(..., min_length=1)


class TodoListPlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/todos")(self.get_todos)
        app.put("/api/todos")(self.put_todo)
        app.patch("/api/todos/<id>")(self.patch_todo)
        app.delete("/api/todos/<id>")(self.delete_todo)

    def get_todos(self, request: Request):
        with TinyDB("db.json") as db:
            todos = db.table("todos").all()
            return [{"id": todo.doc_id, "content": todo["content"]} for todo in todos]

    def put_todo(self, request: Request):
        with TinyDB("db.json") as db:
            todos_table = db.table("todos")
            data = request.json
            todo = Todo(**data)
            todos_table.insert(
                todo.model_dump(mode="json"),
            )
            return "", 204

    def patch_todo(self, request: Request, id: str):
        with TinyDB("db.json") as db:
            todos_table = db.table("todos")
            data = request.json
            todo = Todo(**data)
            todos_table.update(
                todo.model_dump(mode="json"),
                doc_ids=[int(id)],
            )
            return "", 204

    def delete_todo(self, request: Request, id: str):
        with TinyDB("db.json") as db:
            todos_table = db.table("todos")
            todos_table.remove(doc_ids=[int(id)])
            return "", 204
