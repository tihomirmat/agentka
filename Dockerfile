# Agentka web: the prebuilt site (deploy/site = output of `npm run build` in app/) served by a small
# Node server that also takes sign-ups (POST /api/prijava → SQLite in /data + e-mail via Resend).
# The site is built beforehand: building on the 4 GB server overloaded it (9 Oct 2026).
# /data must be a persistent volume in Coolify, otherwise sign-ups are lost on every deploy.
FROM node:22-alpine
ENV NODE_ENV=production PORT=80 SITE_DIR=/app/site DATA_DIR=/data NODE_OPTIONS=--no-warnings
WORKDIR /app
COPY server/server.mjs ./server.mjs
COPY deploy/site ./site
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/api/health || exit 1
CMD ["node", "server.mjs"]
