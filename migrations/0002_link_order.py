from tinydb import TinyDB


def apply():
    with TinyDB("data/db.json") as db:
        table = db.table("links")
        all_links = table.all()

        for index in range(len(all_links)):
            link = all_links[index]
            updated = {**link, "order": index}
            table.update(updated, doc_ids=[link.doc_id])


apply()
