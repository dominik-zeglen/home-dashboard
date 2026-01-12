import urllib.request
import subprocess
from functools import lru_cache
from enum import Enum
from .utils import get_ttl_hash
from dbus_fast import BusType
from dbus_fast.aio import MessageBus

_bus = None


class DeviceType(Enum):
    UNKNOWN = 0
    GENERIC = 14
    ETHERNET = 1
    WIFI = 2
    UNUSED1 = 3
    UNUSED2 = 4
    BT = 5
    OLPC_MESH = 6
    WIMAX = 7
    MODEM = 8
    INFINIBAND = 9
    BOND = 10
    VLAN = 11
    ADSL = 12
    BRIDGE = 13
    TEAM = 15
    TUN = 16
    IP_TUNNEL = 17
    MACVLAN = 18
    VXLAN = 19
    VETH = 20
    MACSEC = 21
    DUMMY = 22
    PPP = 23
    OVS_INTERFACE = 24
    OVS_PORT = 25
    OVS_BRIDGE = 26
    WPAN = 27
    SIXLOWPAN = 28
    WIREGUARD = 29
    WIFI_P2P = 30
    VRF = 31
    LOOPBACK = 32
    HSR = 33
    IPVLAN = 34


def is_physical_device(device_type):
    return device_type in {DeviceType.ETHERNET, DeviceType.WIFI, DeviceType.BT}


def get_hostname():
    result = subprocess.run(
        ["hostname"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return result.stdout.strip()


@lru_cache()
def check_external_ip(cache_key=None):
    try:
        with urllib.request.urlopen("http://icanhazip.com", timeout=3) as response:
            return response.read().decode().strip()
    except Exception:
        return "?"


async def get_bus():
    global _bus
    if _bus is None or not _bus.connected:
        try:
            _bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
        except Exception:
            return None
    return _bus


def check_local_ip_fallback():
    try:
        result = subprocess.run(
            ["ip", "-o", "-f", "inet", "addr", "show"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        ).stdout.strip()
        ips = []
        for line in result.splitlines():
            parts = line.split()
            if len(parts) < 4:
                continue
            device = parts[1]
            addr = parts[3].split("/")[0]
            if addr == "127.0.0.1":
                continue
            if device.startswith(("eth", "en")):
                dev_type = "ethernet"
            elif device.startswith("wl"):
                dev_type = "wifi"
            elif device.startswith(("docker", "br-", "veth")):
                dev_type = "docker"
            else:
                dev_type = "other"
            ips.append({"address": addr, "device": device, "type": dev_type})
        return ips
    except Exception:
        return []


async def check_local_ip():
    bus = await get_bus()
    if not bus:
        return check_local_ip_fallback()

    ips = []
    bus_name = "org.freedesktop.NetworkManager"

    try:
        nm_intro = await bus.introspect(bus_name, "/org/freedesktop/NetworkManager")
        nm = bus.get_proxy_object(
            bus_name,
            "/org/freedesktop/NetworkManager",
            nm_intro,
        )
        nm_interface = nm.get_interface(bus_name)
        devices = await nm_interface.get_all_devices()

        for device in devices:
            device_intro = await bus.introspect(bus_name, device)
            device_obj = bus.get_proxy_object(
                bus_name,
                device,
                device_intro,
            )
            device_interface = device_obj.get_interface(
                "org.freedesktop.NetworkManager.Device"
            )

            ipv4_config = await device_interface.get_ip4_config()

            if ipv4_config != "/":
                ip4_intro = await bus.introspect(bus_name, ipv4_config)
                ip4_obj = bus.get_proxy_object(
                    bus_name,
                    ipv4_config,
                    ip4_intro,
                )
                ip4_interface = ip4_obj.get_interface(
                    "org.freedesktop.NetworkManager.IP4Config"
                )
                address_data = await ip4_interface.get_address_data()
                device_type = DeviceType(await device_interface.get_device_type())
                udi = await device_interface.get_udi()

                for item in address_data:
                    addr = item.get("address").value
                    if addr and is_physical_device(device_type):
                        ips.append(
                            {
                                "address": addr,
                                "device": udi.split("/")[-1],
                                "type": DeviceType(device_type).name.lower(),
                            }
                        )
    except Exception:
        return check_local_ip_fallback()

    return ips if ips else check_local_ip_fallback()


async def network_info():
    return {
        "hostname": get_hostname(),
        "external_ip": check_external_ip(get_ttl_hash(60)),
        "local_ip": await check_local_ip(),
    }
