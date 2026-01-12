from microdot import Microdot, Request
from tinydb import TinyDB, where
from pydantic import BaseModel, Field
import requests
import os
from functools import lru_cache
from .utils import get_ttl_hash
from dataclasses import dataclass, asdict


@dataclass
class City:
    id: int | None
    name: str
    country: str
    state: str | None
    lat: float
    lon: float


class CityInput(BaseModel):
    name: str = Field(..., min_length=2)


class WeatherPlugin:
    def __init__(self, app: Microdot):
        self.app = app
        self.key = os.getenv("OPENWEATHERMAP_API_KEY")

        app.get("/api/weather")(self.get_weather)
        if self.key:
            app.put("/api/weather")(self.put_city)
            app.delete("/api/weather/<id>")(self.delete_city)

    @lru_cache()
    def fetch_weather(self, lat: float, lon: float, cache_key=None):
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.key}&units=metric"
        response = requests.get(url)
        return response.json()

    def get_weather_for_city(self, city: City):
        data = self.fetch_weather(city.lat, city.lon, get_ttl_hash(600))
        return {
            "city": city.name,
            "country": city.country,
            "state": city.state,
            "id": city.id,
            "openweathermap_id": data["id"],
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
        }

    def get_weather(self, request: Request):
        if not self.key:
            return []

        with TinyDB("data/db.json") as db:
            cities = db.table("weather_cities").all()
            weather_data = []
            for city in cities:
                city_input = City(**city)
                city_input.id = city.doc_id
                weather = self.get_weather_for_city(city_input)
                weather_data.append(weather)

            return weather_data

    def put_city(self, request: Request):
        with TinyDB("data/db.json") as db:
            cities_table = db.table("weather_cities")
            data = request.json

            city_input = CityInput(name=data["name"])

            url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_input.name}&limit=1&appid={self.key}"
            response = requests.get(url)
            if response.status_code != 200 or not response.json():
                return "Could not find city", 404

            city_data = response.json()[0]
            city = City(
                name=city_data["name"],
                country=city_data["country"],
                state=city_data.get("state"),
                lat=city_data["lat"],
                lon=city_data["lon"],
                id=None,
            )

            cities_table.insert(
                asdict(city),
            )
            return "", 204

    def delete_city(self, request: Request, id: str):
        with TinyDB("data/db.json") as db:
            cities_table = db.table("weather_cities")
            cities_table.remove(doc_ids=[int(id)])
            return "", 204
