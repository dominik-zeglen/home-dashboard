import os
import re
from tinydb import TinyDB


def get_applied_migrations():
    with TinyDB("data/db.json") as db:
        table = db.table("migrations")
        applied = table.all()
        return {m["name"] for m in applied}


def mark_migration_as_applied(name):
    with TinyDB("data/db.json") as db:
        table = db.table("migrations")
        table.insert({"name": name})


def run_migrations():
    applied_migrations = get_applied_migrations()
    migration_files = sorted(
        f for f in os.listdir("migrations") if re.match(r"[0-9]+_.*\.py", f)
    )

    for migration_file in migration_files:
        if migration_file in applied_migrations:
            continue

        migration_path = os.path.join("migrations", migration_file)
        with open(migration_path) as f:
            code = compile(f.read(), migration_path, "exec")
            exec(code, globals())

        mark_migration_as_applied(migration_file)
        print(f"Applied migration: {migration_file}")
