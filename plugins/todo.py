from microdot import Microdot, Request
from pydantic import BaseModel, Field
from tinydb import TinyDB
from datetime import datetime


class TodoInput(BaseModel):
    content: str = Field(..., min_length=1)


class TodoListPlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/todos")(self.get_todos)
        app.put("/api/todos")(self.put_todo)
        app.patch("/api/todos/<id>")(self.patch_todo)
        app.delete("/api/todos/<id>")(self.delete_todo)

    def get_todos(self, request: Request):
        with TinyDB("data/db.json") as db:
            todos = db.table("todos").all()
            return [{"id": todo.doc_id, **todo} for todo in todos]

    def put_todo(self, request: Request):
        with TinyDB("data/db.json") as db:
            todos_table = db.table("todos")
            data = request.json
            todo_input = TodoInput(**data)
            todos_table.insert(
                {
                    **todo_input.model_dump(mode="json"),
                    "created_at": datetime.now().isoformat(),
                }
            )
            return "", 204

    def patch_todo(self, request: Request, id: str):
        with TinyDB("data/db.json") as db:
            todos_table = db.table("todos")
            data = request.json
            todo_input = TodoInput(**data)
            todo = todos_table.get(doc_id=int(id))

            if not todo:
                return {"error": "Todo not found"}, 404

            todos_table.update(
                {
                    **todo_input.model_dump(mode="json"),
                    "created_at": todo["created_at"],
                },
                doc_ids=[todo.doc_id],
            )
            return "", 204

    def delete_todo(self, request: Request, id: str):
        with TinyDB("data/db.json") as db:
            todos_table = db.table("todos")
            todos_table.remove(doc_ids=[int(id)])
            return "", 204
