import time
from dbus_fast.aio import MessageBus
from dbus_fast import BusType


def get_ttl_hash(seconds=3600):
    """Return the same value withing `seconds` time period"""
    return round(time.time() / seconds)


_bus = None
_bus_tried = False


async def get_bus():
    global _bus
    global _bus_tried

    if _bus is None and not _bus_tried:
        try:
            _bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
        except Exception as e:
            _bus_tried = True
            print(e)
            return None
    return _bus
