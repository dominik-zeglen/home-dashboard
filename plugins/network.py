import urllib.request
import subprocess
from functools import lru_cache
from .utils import get_ttl_hash
from dbus_fast.message import Message
from dbus_fast import BusType
from dbus_fast.aio import MessageBus
from enum import Enum


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


async def check_local_ip():
    ips = []
    bus_name = "org.freedesktop.NetworkManager"

    try:
        bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
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
    finally:
        if bus.connected:
            bus.disconnect()
        return ips


async def network_info():
    return {
        "hostname": get_hostname(),
        "external_ip": check_external_ip(get_ttl_hash(60)),
        "local_ip": await check_local_ip(),
    }
