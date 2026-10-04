# Deploy B.B BudyBattle on Render + GitHub

## GitHub

This game lives in the **`bb-budybattle-for-real`** folder inside the [castle-shields-2](https://github.com/xanderstcandy/castle-shields-2) repo.

From your machine (after committing):

```bash
cd castle-shields-2
git add bb-budybattle-for-real render.yaml
git commit -m "Add BudyBattle web app and Render config"
git push origin main
```

`accounts.json` is gitignored so player passwords never go to GitHub.

## Render (one-click from GitHub)

1. Sign in at [render.com](https://render.com) and connect your GitHub account.
2. **New → Blueprint** and select the `castle-shields-2` repo (Render reads `render.yaml` at the repo root).
3. Confirm the **Web Service** `bb-budybattle`:
   - **Root directory:** `bb-budybattle-for-real`
   - **Build:** `npm install --omit=dev`
   - **Start:** `npm start`
   - **Health check:** `/health`
4. Deploy. Your live URL will look like `https://bb-budybattle.onrender.com`.

### Accounts and saves

- Set **`DATA_DIR=/var/data`** (already in `render.yaml`) and attach the **1 GB disk** so `accounts.json` survives restarts.
- Without a disk, accounts reset whenever Render redeploys or moves your instance.

### Free tier notes

- The service may **sleep after ~15 minutes** with no traffic; the first visit can take 30–60 seconds to wake up.
- Long **WebSocket** matches need the service awake; idle sleep can drop connections. A paid instance stays on and is more stable for multiplayer.

## Local vs production

| | Local | Render |
|---|--------|--------|
| Port | 3003 (or `PORT`) | `PORT` from Render |
| Data | `accounts.json` next to `server.js` | `DATA_DIR/accounts.json` on disk |

WebSockets use the same host as the page (`wss://` on HTTPS), so no extra client config is required.

## Connection drops mid-battle

The server now:

- Sends **WebSocket ping** every 25s so proxies do not treat the match as idle.
- Gives you **45 seconds to reconnect** after a drop instead of eliminating you immediately.
- The browser **auto-reconnects** and resumes the same match when you sign in again on the new socket.

If you still disconnect often on Render free tier, try a **Starter** (always-on) plan or play during an active session right after the site wakes up.
