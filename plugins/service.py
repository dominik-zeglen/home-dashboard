import math
from microdot import Microdot, Request

DBUS_AVAILABLE = False
_bus = None

try:
	from dbus_fast.aio import MessageBus
	from dbus_fast import BusType
	DBUS_AVAILABLE = True
except ImportError:
	pass


async def get_bus():
	global _bus
	if not DBUS_AVAILABLE:
		return None
	if _bus is None:
		try:
			_bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
		except Exception:
			return None
	return _bus


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
		})

	units.sort(key=lambda u: (u["state"] != "active", u["state"] != "failed", u["name"]))
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

	async def get_services(self, request: Request):
		state = request.args.get("state", "all")
		search = request.args.get("search", "")
		page = int(request.args.get("page", 1))
		limit = int(request.args.get("limit", 10))
		return await list_units(state, search, page, limit)
