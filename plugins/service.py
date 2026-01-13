from async_lru import alru_cache
from microdot import Microdot, Request
from tinydb import TinyDB
from .utils import get_bus
from pydantic import BaseModel, Field
from .utils import get_ttl_hash
import aiohttp
import asyncio
from random import random


async def fetch_data(session, url):
    async with session.get(url) as response:
        data = await response.json()
        return data if response.status == 200 else []


class ServiceInput(BaseModel):
    name: str = Field(..., min_length=3)
    host: str = Field(..., min_length=3)


class ServicePlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/services")(self.get_services)
        app.get("/api/services/all")(self.handle_get_all_services)
        app.get("/api/services/pinned")(self.get_pinned_services)
        app.post("/api/services/pin")(self.pin_service)
        app.post("/api/services/unpin")(self.unpin_service)

    async def handle_get_all_services(self, request: Request):
        bust = request.args.get("bust", "false").lower() == "true"
        return await self.get_all_services(
            cache_key=random() if bust else get_ttl_hash(300)
        )

    @alru_cache(maxsize=1)
    async def get_all_services(self, cache_key: int):
        services = []
        monitored_hosts = []
        with TinyDB("data/db.json") as db:
            monitored_hosts = db.table("monitored_devices").all()

        async with aiohttp.ClientSession() as session:
            urls = []
            for host in monitored_hosts:
                host_address = host.get("hostname")
                urls.append(f"http://{host_address}/api/services")

            tasks = [fetch_data(session, url) for url in urls]
            results = await asyncio.gather(*tasks)

            for result, index in zip(results, range(len(results))):
                for service in result:
                    services.append(
                        {**service, "host": monitored_hosts[index].get("hostname")}
                    )

            return services, 200

    async def get_services(self, cache_key: int):
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
