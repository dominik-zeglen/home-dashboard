import subprocess
import json


class DockerPlugin:
    engine = "docker"

    def __init__(self, app):
        try:
            subprocess.run(["docker"])
        except FileNotFoundError:
            self.engine = "nerdctl"

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
