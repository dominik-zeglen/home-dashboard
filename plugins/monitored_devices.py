from microdot import Microdot, Request
from pydantic import Field, BaseModel
from tinydb import TinyDB


class DeviceInput(BaseModel):
    hostname: str = Field(..., min_length=3)


class MonitoredDevicesPlugin:
    def __init__(self, app: Microdot):
        app.get("/api/monitored_devices")(self.get_devices)
        app.put("/api/monitored_devices")(self.add_device)
        app.delete("/api/monitored_devices/<device_id>")(self.remove_device)

    def add_device(self, request: Request):
        with TinyDB("db.json") as db:
            table = db.table("monitored_devices")
            data = request.json
            device_input = DeviceInput(**data)
            table.insert(device_input.model_dump(mode="json"))
            return "", 204

    def get_devices(self, request: Request):
        with TinyDB("db.json") as db:
            table = db.table("monitored_devices")
            devices = table.all()
            for device in devices:
                device["id"] = device.doc_id
            return devices

    def remove_device(self, request: Request, device_id: str):
        with TinyDB("db.json") as db:
            table = db.table("monitored_devices")
            table.remove(doc_ids=[int(device_id)])
            return "", 204
