from microdot import Microdot, Response, Request, send_file
from microdot.cors import CORS
import os
from dotenv import load_dotenv
from pydantic import ValidationError

from plugins.hardware import hardware_info
from plugins.monitored_devices import MonitoredDevicesPlugin
from plugins.network import network_info
from plugins.service import ServicePlugin
from plugins.docker import DockerPlugin
from plugins.todo import TodoListPlugin
from plugins.weather import WeatherPlugin
from plugins.links import LinkPlugin

load_dotenv()

debug = os.getenv("DEBUG", "False").lower() == "true"

Response.default_content_type = "application/json"
app = Microdot()
cors = CORS(allowed_origins="*")
cors.initialize(app=app)


@app.errorhandler(ValidationError)
def handle_validation_error(request: Request, exc: ValidationError):
    return {"error": "Invalid input", "details": exc.errors()}, 400


# services = {
#     "Minecraft": {
#         "service": "minecraft",
#     },
#     "Updog": {"service": "updog", "url": "http://updog.lan"},
#     "VPN": {"service": "openvpn@pl-waw.prod.surfshark.com_udp"},
#     "Transmission": {"service": "transmission-daemon", "url": "http://torrent.lan"},
# }
# ssh_user = "anders"
# ssh_server = "trufla.xyz"
# ssh_tunnel_ports = [12842]


# def check_tunnel(port):
#     """Check if an SSH reverse tunnel is active on a given port."""
#     try:
#         result = subprocess.run(
#             ["ps", "aux"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
#         )
#         for line in result.stdout.splitlines():
#             if "ssh" in line and f"R {port}:" in line:
#                 return True
#     except Exception:
#         return False


# def start_tunnel(port):
#     subprocess.Popen(
#         ["ssh", "-fN", "-R", f"{port}:localhost:{port}", f"{ssh_user}@{ssh_server}"]
#     )


# def stop_tunnel(port):
#     result = subprocess.run(
#         ["ps", "aux"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
#     )
#     for line in result.stdout.splitlines():
#         if "ssh" in line and f"R {port}:" in line:
#             pid = line.split()[1]
#             subprocess.run(["kill", pid])

services = ServicePlugin(app)
docker = DockerPlugin(app)
todo_list = TodoListPlugin(app)
weather = WeatherPlugin(app)
links = LinkPlugin(app)
monitored_devices = MonitoredDevicesPlugin(app)


@app.get("/api/status")
async def get_payload(request: Request):
    payload = {
        "services": services.get_payload(),
        "docker": docker.get_containers(),
        "hardware": hardware_info(),
        "network": await network_info(),
        # "ssh_tunnels": {port: check_tunnel(port) for port in ssh_tunnel_ports},
    }
    return payload


@app.get("/")
def index(request: Request):
    return send_file("public/index.html")


@app.get("/<path:path>")
def public_files(request: Request, path: str):
    if ".." in path:
        return "Not found", 404
    return send_file(path)


app.run(
    debug=debug,
    port=int(os.environ.get("PORT", 18745)),
)
