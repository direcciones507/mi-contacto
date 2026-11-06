FROM node:24-trixie-slim AS node_runtime
FROM postgres:18-trixie
# Official PostgreSQL image supplies compatible pg_dump/pg_restore. No database server runs here.
COPY --from=node_runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node_runtime /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
 && node --version && pg_dump --version
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
ENTRYPOINT []
CMD ["node","ops/private-start.mjs"]
