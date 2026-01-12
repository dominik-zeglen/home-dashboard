import math
from microdot import Microdot, Request
from tinydb import TinyDB
from dbus_fast.aio import MessageBus
from dbus_fast import BusType

_bus = None


async def get_bus():
	global _bus
	if _bus is None:
		try:
			_bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
		except Exception:
			return None
	return _bus


def get_pinned_services():
	with TinyDB("data/db.json") as db:
		pinned = db.table("pinned_services").all()
		return {item["name"] for item in pinned}


async def list_units(state: str = "all", search: str = "", page: int = 1, limit: int = 10):
	bus = await get_bus()
	if not bus:
		return {"units": [], "total": 0, "page": 1, "pages": 0}

	try:
		introspection = await bus.introspect("org.freedesktop.systemd1", "/org/freedesktop/systemd1")
		systemd = bus.get_proxy_object("org.freedesktop.systemd1", "/org/freedesktop/systemd1", introspection)
		manager = systemd.get_interface("org.freedesktop.systemd1.Manager")
		raw_units = await manager.call_list_units()
	except Exception:
		return {"units": [], "total": 0, "page": 1, "pages": 0}

	pinned = get_pinned_services()
	units = []
	for unit in raw_units:
		name, description, _, active_state, sub_state, *_ = unit
		if not name.endswith(".service"):
			continue
		if state != "all" and active_state != state:
			continue
		if search and search.lower() not in name.lower():
			continue
		units.append({
			"name": name,
			"state": active_state,
			"sub_state": sub_state,
			"description": description,
			"pinned": name in pinned,
		})

	units.sort(key=lambda u: (not u["pinned"], u["state"] != "active", u["state"] != "failed", u["name"]))
	total = len(units)
	pages = math.ceil(total / limit) if limit > 0 else 1
	start = (page - 1) * limit
	end = start + limit

	return {
		"units": units[start:end],
		"total": total,
		"page": page,
		"pages": pages,
	}


class ServicePlugin:
	def __init__(self, app: Microdot):
		self.app = app
		app.get("/api/services")(self.get_services)
		app.put("/api/services/pin/<name>")(self.pin_service)
		app.delete("/api/services/pin/<name>")(self.unpin_service)

	async def get_services(self, request: Request):
		state = request.args.get("state", "all")
		search = request.args.get("search", "")
		page = int(request.args.get("page", 1))
		limit = int(request.args.get("limit", 10))
		return await list_units(state, search, page, limit)

	def pin_service(self, request: Request, name: str):
		with TinyDB("data/db.json") as db:
			table = db.table("pinned_services")
			existing = table.search(lambda x: x["name"] == name)
			if not existing:
				table.insert({"name": name})
		return "", 204

	def unpin_service(self, request: Request, name: str):
		with TinyDB("data/db.json") as db:
			table = db.table("pinned_services")
			table.remove(lambda x: x["name"] == name)
		return "", 204
