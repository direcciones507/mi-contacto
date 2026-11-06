FROM node:24-bookworm-slim
ENV NODE_ENV=production MC_BIND_HOST=0.0.0.0 PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gosu fonts-dejavu-core && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/keyrings/postgresql.asc && \
    echo 'deb [signed-by=/usr/share/keyrings/postgresql.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main' > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y --no-install-recommends postgresql-client-18 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p /var/lib/mi-contacto/photos && chown -R node:node /var/lib/mi-contacto && chmod 700 /var/lib/mi-contacto/photos
USER root
ENTRYPOINT ["sh", "/app/docker/entrypoint.sh"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node scripts/healthcheck.mjs
# Start the application directly without a one-time upgrade gate.
CMD ["node", "scripts/start-server.mjs"]
