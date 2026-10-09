# Agentka web (stage 1: front end with sample data).
# The site is built beforehand (deploy/site = output of `npm run build` in app/), so the
# server only copies files. Building on the 4 GB server overloaded it (9 Oct 2026).
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/site /usr/share/nginx/html
EXPOSE 80
