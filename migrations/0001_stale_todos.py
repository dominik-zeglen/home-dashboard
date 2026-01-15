from datetime import datetime
from tinydb import TinyDB


def apply():
    with TinyDB("data/db.json") as db:
        table = db.table("todos")
        all_todos = table.all()

        for todo in all_todos:
            updated = {**todo, "created_at": datetime().utcnow().isoformat()}
            table.update(updated, doc_ids=[todo.doc_id])


apply()
