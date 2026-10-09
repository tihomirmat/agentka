Deployment (Coolify on the Hetzner server, app "Agentka" → agentka.si, www.agentka.si).

To publish a new version: in app/ run `npm run build`, copy app/dist to deploy/site
(rm -rf deploy/site && cp -r app/dist deploy/site), commit and push. Coolify only copies
the files into nginx; nothing is compiled on the server.
