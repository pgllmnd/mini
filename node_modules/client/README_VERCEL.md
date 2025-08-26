Deploying the client to Vercel

1) Project selection
- You can deploy just the `client` folder as a Vercel project (recommended) or the monorepo root and configure the `client` build output.

2) Add environment variable
- In your Vercel project settings -> Environment Variables, add:
  - Key: `VITE_API_URL`
  - Value: `https://your-api.example.com` (replace with your server URL)
  - Target: Production (and Preview if you want previews to use a staging API)

3) Build & Output
- This repo's client uses Vite. The included `vercel.json` instructs Vercel to run the static build using `@vercel/static-build` and expects the build output in `dist`.
- Make sure your `client/package.json` has a `build` script that runs the Vite build and outputs to `dist` (Vite's default for many templates).

4) Local dev
- Locally, the client falls back to `http://localhost:5000` if `VITE_API_URL` isn't set, so you can run your server locally and the client will point to it.

Notes on the server
- If you plan to host the server elsewhere, set `VITE_API_URL` to that server's public URL.
- You mentioned you run migrations with psql CLI; run migrations before pointing the client to the production server.
