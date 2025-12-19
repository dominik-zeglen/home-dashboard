import urllib.request
import subprocess
from functools import lru_cache
from .utils import get_ttl_hash


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


# Get local IP addresses
def check_local_ip():
    try:
        result = subprocess.run(
            ["ip", "-f", "inet", "addr", "show", "eth0"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        ).stdout.strip()
        ips = [
            line.split()[1].split("/")[0]
            for line in result.splitlines()
            if "inet " in line
        ]
        return ips
    except:
        return ["Unknown"]


def network_info():
    return {
        "hostname": get_hostname(),
        "external_ip": check_external_ip(get_ttl_hash(60)),
        "local_ip": check_local_ip(),
    }
