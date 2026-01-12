import subprocess
import json
from microdot import Request


class DockerPlugin:
    engine = "docker"

    def __init__(self, app):
        try:
            subprocess.run(
                ["docker", "version"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except FileNotFoundError:
            self.engine = "nerdctl"
        app.post("/api/docker/<container_id>/start")(self.start_container)
        app.post("/api/docker/<container_id>/stop")(self.stop_container)
        app.post("/api/docker/<container_id>/restart")(self.restart_container)

    def _run_command(self, action: str, container_id: str):
        try:
            result = subprocess.run(
                [self.engine, action, container_id],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            if result.returncode == 0:
                return "", 204
            return {"error": result.stderr.strip()}, 500
        except OSError as e:
            return {"error": str(e)}, 500

    def start_container(self, request: Request, container_id: str):
        return self._run_command("start", container_id)

    def stop_container(self, request: Request, container_id: str):
        return self._run_command("stop", container_id)

    def restart_container(self, request: Request, container_id: str):
        return self._run_command("restart", container_id)

    def get_containers(self):
        try:
            result = subprocess.run(
                [self.engine, "ps", "-a", "--format", "json"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            ).stdout.splitlines()
            containers = [json.loads(line) for line in result]

            return [
                {
                    "running": container.get("Status") == "Up"
                    or container.get("State") == "running",
                    "image": container.get("Image"),
                    "id": container.get("ID"),
                    "name": container.get("Names"),
                }
                for container in containers
            ]
        except (OSError, json.JSONDecodeError, KeyError):
            return []
