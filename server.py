from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import subprocess
import urllib.request
import json
import time


port = int(os.environ.get("PORT", 18745))
services = {
    "Minecraft": {
        "service": "minecraft",
    },
    "Updog": {"service": "updog", "url": "http://updog.lan"},
    "VPN": {"service": "openvpn@pl-waw.prod.surfshark.com_udp"},
    "Transmission": {"service": "transmission-daemon", "url": "http://torrent.lan"},
}
ssh_user = "anders"
ssh_server = "trufla.xyz"
ssh_tunnel_ports = [12842]


def get_temperature():
    result = subprocess.run(
        ["vcgencmd", "measure_temp"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    return result.stdout.strip().split("=")[1].split("'")[0]


def read_all_cpu_stats():
    cpu_stats = {}
    with open("/proc/stat", "r") as f:
        for line in f:
            if line.startswith("cpu"):
                parts = line.strip().split()
                cpu_label = "all" if parts[0] == "cpu" else f"core{parts[0][3:]}"
                values = list(map(int, parts[1:]))
                cpu_stats[cpu_label] = values
            else:
                break  # Stop once non-CPU lines start
    return cpu_stats


def calculate_idle_percent(before, after):
    percentages = {}
    for cpu in before:
        total_before = sum(before[cpu])
        idle_before = before[cpu][3]

        total_after = sum(after[cpu])
        idle_after = after[cpu][3]

        total_delta = total_after - total_before
        idle_delta = idle_after - idle_before

        if total_delta > 0:
            idle_pct = 100 - (idle_delta / total_delta) * 100.0
        else:
            idle_pct = 100

        percentages[cpu] = idle_pct
    return percentages


def get_cpu_idle_percentages(interval=1.0):
    before = read_all_cpu_stats()
    time.sleep(interval)
    after = read_all_cpu_stats()

    return calculate_idle_percent(before, after)


def get_used_and_total_ram():
    result = subprocess.run(
        ["free", "-h"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    for line in result.stdout.splitlines():
        if "Mem:" in line:
            return line.split()[1:4]


def get_used_and_total_disk():
    result = subprocess.run(
        ["df", "-h"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    omitted = [
        "tmpfs",
        "udev",
        "overlay",
        "shm",
        "snap",
        "cgroup",
        "mmcblk0p1",
        "Filesystem",
    ]
    disks = {}
    for line in result.stdout.splitlines():
        if any(x in line for x in omitted):
            continue
        name, size, used, available, percent, mount, *_ = line.split()
        disks[name] = {
            "size": size,
            "used": used,
            "available": available,
            "percent": percent,
            "mount": mount,
        }

    return disks


def check_service(name):
    try:
        result = subprocess.run(
            ["systemctl", "is-active", name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return result.stdout.strip() == "active"
    except Exception:
        return False


def get_hostname():
    result = subprocess.run(
        ["hostname"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return result.stdout.strip()


def check_external_ip():
    try:
        with urllib.request.urlopen("http://icanhazip.com", timeout=3) as response:
            return response.read().decode().strip()
    except Exception:
        return "?"


def check_local_ip():
    result = subprocess.run(
        ["hostname", "-I"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return result.stdout.strip().split(" ")


def get_uptime():
    result = subprocess.run(
        ["uptime", "-p"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return result.stdout.strip()


def check_tunnel(port):
    """Check if an SSH reverse tunnel is active on a given port."""
    try:
        result = subprocess.run(
            ["ps", "aux"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        for line in result.stdout.splitlines():
            if "ssh" in line and f"R {port}:" in line:
                return True
    except Exception:
        return False


def start_tunnel(port):
    subprocess.Popen(
        ["ssh", "-fN", "-R", f"{port}:localhost:{port}", f"{ssh_user}@{ssh_server}"]
    )


def stop_tunnel(port):
    result = subprocess.run(
        ["ps", "aux"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    for line in result.stdout.splitlines():
        if "ssh" in line and f"R {port}:" in line:
            pid = line.split()[1]
            subprocess.run(["kill", pid])


def get_payload():
    payload = {
        "services": {
            name: {
                "status": check_service(serviceInfo.get("service")),
                "url": serviceInfo["url"] if "url" in serviceInfo else None,
            }
            for name, serviceInfo in services.items()
        },
        "disk": get_used_and_total_disk(),
        "ram": get_used_and_total_ram(),
        "hostname": get_hostname(),
        "external_ip": check_external_ip(),
        "local_ip": check_local_ip(),
        "ssh_tunnels": {port: check_tunnel(port) for port in ssh_tunnel_ports},
        "uptime": get_uptime(),
        "cpu": get_cpu_idle_percentages(),
        "temperature": get_temperature(),
    }
    return payload


def reboot():
    subprocess.run(["reboot"])


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            payload = get_payload()
            self.send_response(200)
        except Exception as e:
            payload = {"error": str(e)}
            self.send_response(500)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(bytes(json.dumps(payload), "utf-8"))

    def do_POST(self):
        pass


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"Server running on http://localhost:{port}")
    server.serve_forever()
