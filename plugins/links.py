from microdot import Microdot, Request
from pydantic import BaseModel, HttpUrl, Field
from tinydb import TinyDB, where
import requests
from html.parser import HTMLParser


# Parse HTML to find an icon
class DocumentParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.icon = None

    def handle_starttag(self, tag, attrs):
        if self.icon:
            return

        if tag == "link":
            for attr in attrs:
                if attr[0] == "rel" and "icon" in attr[1]:
                    self.icon = dict(attrs).get("href")
                    break


class Link(BaseModel):
    url: HttpUrl
    name: str = Field(..., min_length=1)
    icon: str | None = Field(default=None)


class LinkPlugin:
    def __init__(self, app: Microdot):
        self.app = app
        app.get("/api/link")(self.get_links)
        app.put("/api/link")(self.put_link)
        app.delete("/api/link/<id>")(self.delete_link)

    def get_links(self, request: Request):
        with TinyDB("data/db.json") as db:
            links = db.table("links").all()

            return [
                {
                    "id": link.doc_id,
                    "name": link["name"],
                    "url": link["url"],
                    "icon": link.get("icon"),
                }
                for link in links
            ]

    def put_link(self, request: Request):
        with TinyDB("data/db.json") as db:
            links_table = db.table("links")
            data = request.json
            link = Link(**data)

            if not link.icon:
                response = requests.get(link.url)
                if response.status_code == 200:
                    parser = DocumentParser()
                    parser.feed(response.text)
                    if parser.icon:
                        if parser.icon.startswith("http") or parser.icon.startswith(
                            "data:"
                        ):
                            link.icon = parser.icon
                        else:
                            link.icon = requests.compat.urljoin(
                                link.url.__str__(), parser.icon
                            )

            links_table.insert(
                link.model_dump(mode="json"),
            )
            return "", 204

    def delete_link(self, request: Request, id: str):
        with TinyDB("data/db.json") as db:
            links_table = db.table("links")
            links_table.remove(doc_ids=[int(id)])
            return "", 204
