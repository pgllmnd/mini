Deployment to Render

This repository contains a Node/Express API server (`server/`) written in TypeScript and a Vite React client (`client/`).

Overview
- Server: `server/` — TypeScript, uses `pg` and Prisma. Build produces `dist/` (via `npm run build`).
- Client: `client/` — Vite + React. Build produces `client/dist`.

Render setup (recommended)
1. Ensure `main` branch contains your production-ready code.
2. In the Render dashboard, create a new "Web Service" and point it to this repository. Alternatively use the provided `render.yaml` to define two services (web + static site).

Environment variables (server)
- DATABASE_URL - Postgres connection string (required)
- JWT_SECRET - secret used for JWT (recommended)
- NODE_ENV - set to `production`
- Optional: other vars used in your `.env`

Render-specific notes
- `render.yaml` defines two services: `mini-stack-overflow-server` and `mini-stack-overflow-client`. Adjust `branch` and `plan` as needed.
- The server build step runs `npm run build` under `server/` and the start command runs the compiled `dist/index.js`.
- The client static site expects the build output in `client/dist` (Vite default). If your Vite config outputs to a different folder, update `render.yaml`.

Docker and automated migrations
- The server service in `render.yaml` is configured to build using the provided `server/Dockerfile`.
- A Render "job" called `mini-stack-overflow-prisma-migrate` is provided to run migrations. It uses the same Dockerfile and the `start.sh` entrypoint which runs `prisma generate` and `prisma migrate deploy` before starting the server.
- To run migrations on Render, use the one-off job or configure the job to run automatically in your pipeline.

Commands you can run locally to verify builds
```bash
# Server
cd server
npm install
npm run build
node dist/index.js

# Client
cd client
npm install
npm run build
npx serve client/dist
```

Troubleshooting
- If the server fails at startup, check `DATABASE_URL` and run `npx prisma migrate deploy` if using Prisma migrations.
- If assets 404 on the client, confirm `staticPublishPath` matches the Vite build output.

If you'd like, I can:
- Add a Dockerfile for the server instead of relying on the node environment.
- Update `render.yaml` to run Prisma migrations as part of the deploy.
- Add a small healthcheck endpoint and a Render health check configuration.

Tell me which of the above extras you'd like and I'll add them.

GitHub & CI/CD (push to https://github.com/gllmnd3/mini.git)

To publish this repository to the GitHub repo you provided and enable CI/CD:

1. Add the remote and push (run locally):

```bash
git remote add github git@github.com:gllmnd3/mini.git
git push github main
```

2. Configure repository secrets (Settings → Secrets) for CI and for deployments:
- `GITHUB_TOKEN` (already provided by Actions for GHCR pushes)
- `RENDER_API_KEY` (if you plan to call Render API from Actions)
- `DATABASE_URL` for any jobs that need DB access

3. The included GitHub Action builds the client and pushes a server image to GitHub Container Registry (GHCR). You can then configure Render to pull the image from GHCR.

