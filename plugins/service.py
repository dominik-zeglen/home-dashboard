from microdot import Microdot, Request
from tinydb import TinyDB
from .utils import get_bus


class ServicePlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/services")(self.get_services)
        app.post("/api/services/pin")(self.pin_service)
        app.post("/api/services/unpin")(self.unpin_service)

    async def get_services(self, request: Request):
        bus = await get_bus()
        if not bus:
            return []

        try:
            introspection = await bus.introspect(
                "org.freedesktop.systemd1", "/org/freedesktop/systemd1"
            )
            systemd = bus.get_proxy_object(
                "org.freedesktop.systemd1", "/org/freedesktop/systemd1", introspection
            )
            manager = systemd.get_interface("org.freedesktop.systemd1.Manager")
            raw_units = await manager.call_list_units()
        except Exception:
            return []

        pinned = self.get_pinned_services()
        units = []
        for unit in raw_units:
            name, description, _, active_state, sub_state, *_ = unit
            if not name.endswith(".service"):
                continue

            units.append(
                {
                    "name": name,
                    "state": active_state,
                    "sub_state": sub_state,
                    "description": description,
                    "pinned": name in pinned,
                }
            )

        return units

    def pin_service(self, request: Request):
        name = request.json.get("name")
        with TinyDB("data/db.json") as db:
            table = db.table("pinned_services")
            existing = table.search(lambda x: x["name"] == name)
            if not existing:
                table.insert({"name": name})
        return "", 204

    def unpin_service(self, request: Request):
        name = request.json.get("name")
        with TinyDB("data/db.json") as db:
            table = db.table("pinned_services")
            table.remove(lambda x: x["name"] == name)
        return "", 204

    def get_pinned_services(self):
        with TinyDB("data/db.json") as db:
            pinned = db.table("pinned_services").all()
            return {item["name"] for item in pinned}
