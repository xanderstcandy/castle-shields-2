# Deploy B.B BudyBattle on Render + GitHub

## GitHub

This game lives in the **`bb-budybattle-for-real`** folder inside the [castle-shields-2](https://github.com/xanderstcandy/castle-shields-2) repo.

Push changes to `main` so Render can deploy them.

`accounts.json` is gitignored. Production accounts live in **Neon Postgres**, not on disk.

## Render (Blueprint or manual Web Service)

### Option A — Blueprint (both games in one repo)

1. [render.com](https://render.com) → **New → Blueprint** → select **castle-shields-2**.
2. Render reads `render.yaml` and creates/updates:
   - **castle-shields-2** (existing Castle Shields app)
   - **bb-budybattle** (this game, `rootDir: bb-budybattle-for-real`, **Free** plan)
3. When prompted, set **`DATABASE_URL`** for **bb-budybattle** (see Neon below).

You do **not** need a paid disk. Both services can use `plan: free`.

### Option B — Manual Web Service (no Blueprint)

1. **New → Web Service** → same GitHub repo.
2. **Root Directory:** `bb-budybattle-for-real`
3. **Build:** `npm install --omit=dev`
4. **Start:** `npm start`
5. **Instance type:** Free
6. **Health Check Path:** `/health`
7. Add env var **`DATABASE_URL`** (Neon connection string).

## Neon Postgres (accounts survive on Free Render)

BudyBattle uses table **`bb_accounts`** (separate from Castle Shields’ `accounts` table). You can use the **same Neon project** and connection string as Castle Shields, or a new database.

1. In [Neon Console](https://console.neon.tech), open your project (or create one).
2. Copy the **pooled** connection string (`DATABASE_URL`), e.g.  
   `postgresql://user:pass@ep-....pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. In Render → **bb-budybattle** → **Environment** → add **`DATABASE_URL`** with that value.
4. Redeploy. On first boot the server creates `bb_accounts` automatically.

**One-time migration:** If you had local `accounts.json`, put it next to `server.js` before the first Postgres boot (or set `DATA_DIR` locally). The server imports those rows into `bb_accounts` when the table is empty.

Without `DATABASE_URL`, the app falls back to **`accounts.json`** (fine for local dev; on Render Free, file data is lost on redeploy).

## Free tier notes

- The service may **sleep after ~15 minutes** with no traffic; the first visit can take 30–60 seconds to wake up.
- Long **WebSocket** matches need the service awake; sleep can drop connections. Starter (paid) stays on longer.

WebSockets use the same host as the page (`wss://` on HTTPS).

## Connection drops mid-battle

- **WebSocket ping** every 25s
- **45 seconds to reconnect** before elimination
- Browser **auto-reconnects** and resumes the match
