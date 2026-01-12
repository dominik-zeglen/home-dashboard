from microdot import Microdot, Request
from tinydb import TinyDB
from .utils import get_bus
from pydantic import BaseModel, Field


class ServiceInput(BaseModel):
    name: str = Field(..., min_length=3)
    host: str = Field(..., min_length=3)


class ServicePlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/services")(self.get_services)
        app.get("/api/services/pinned")(self.get_pinned_services)
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
                }
            )

        return units

    def pin_service(self, request: Request):
        service_input = ServiceInput(**request.json)

        with TinyDB("data/db.json") as db:
            table = db.table("pinned_services")
            existing = table.search(
                lambda x: x.get("name") == service_input.name
                and x.get("host") == service_input.host
            )
            if not existing:
                table.insert({"name": service_input.name, "host": service_input.host})

        return "", 204

    def unpin_service(self, request: Request):
        service_input = ServiceInput(**request.json)

        with TinyDB("data/db.json") as db:
            table = db.table("pinned_services")
            table.remove(
                lambda x: x.get("name") == service_input.name
                and x.get("host") == service_input.host
            )
        return "", 204

    def get_pinned_services(self, request: Request):
        with TinyDB("data/db.json") as db:
            pinned = db.table("pinned_services").all()
            return pinned, 200
