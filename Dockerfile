FROM oven/bun:1.3.10

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3001

CMD ["./scripts/docker-entrypoint.sh"]
