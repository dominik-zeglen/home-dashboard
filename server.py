from microdot import Microdot, Response, Request, send_file
from microdot.cors import CORS
import os
from dotenv import load_dotenv
from pydantic import ValidationError

from plugins.hardware import hardware_info
from plugins.monitored_devices import MonitoredDevicesPlugin
from plugins.network import network_info
from plugins.docker import DockerPlugin
from plugins.todo import TodoListPlugin
from plugins.weather import WeatherPlugin
from plugins.links import LinkPlugin

load_dotenv()

from plugins.service import ServicePlugin

debug = os.getenv("DEBUG", "False").lower() == "true"

Response.default_content_type = "application/json"
app = Microdot()
cors = CORS(allowed_origins="*")
cors.initialize(app=app)


@app.errorhandler(ValidationError)
def handle_validation_error(request: Request, exc: ValidationError):
    return {"error": "Invalid input", "details": exc.errors()}, 400


services = ServicePlugin(app)
docker = DockerPlugin(app)
todo_list = TodoListPlugin(app)
weather = WeatherPlugin(app)
links = LinkPlugin(app)
monitored_devices = MonitoredDevicesPlugin(app)


@app.get("/api/status")
async def get_payload(request: Request):
    return {
        "docker": docker.get_containers(),
        "hardware": hardware_info(),
        "network": await network_info(),
    }


@app.get("/")
def index(request: Request):
    return send_file("public/index.html")


@app.get("/favicon.ico")
def favicon(request: Request):
    return "", 204


@app.get("/<path:path>")
def public_files(request: Request, path: str):
    if ".." in path:
        return "Not found", 404
    return send_file(path)


app.run(
    debug=debug,
    port=int(os.environ.get("PORT", 18745)),
)
