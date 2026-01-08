#!/bin/sh
mkdir -p /app/data
[ -f /app/data/db.json ] || echo '{}' > /app/data/db.json
exec python server.py
