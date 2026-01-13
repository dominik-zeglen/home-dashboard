FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY webpack.config.js tsconfig.json postcss.config.js tailwind.config.js ./
COPY src/ ./src/
COPY components/ ./components/
COPY lib/ ./lib/
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
	iproute2 \
	procps \
	curl \
	&& curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.4.1.tgz \
	| tar xz --strip-components=1 -C /usr/local/bin docker/docker \
	&& apt-get purge -y curl \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY server.py .
COPY plugins/ ./plugins/
COPY migrations/ ./migrations/
COPY --from=frontend-builder /app/public/ ./public/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PORT=18745
ENV DEBUG=false

EXPOSE 18745

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
	CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:18745/api/status')" || exit 1

ENTRYPOINT ["./entrypoint.sh"]
