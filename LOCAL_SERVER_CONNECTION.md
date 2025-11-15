# Connect Local Server to Live Website

This guide explains how to connect your local Node.js server (`http://192.168.61.55:3000/`) to the live website (`https://node-js-ip-test.vercel.app/`) so that local device data is displayed on the live site.

## How It Works

1. **Local Server** runs on `http://192.168.61.55:3000/`
2. **Live Website** automatically tries to connect to the local server
3. When connected, the live website displays your local device name and IP

## Setup Instructions

### Step 1: Keep Local Server Running

Make sure your local server is running:

```bash
npm start
```

The server should be accessible at: `http://192.168.61.55:3000/`

### Step 2: Expose Local Server to Internet (Required)

Since your local server is on a private network (192.168.x.x), the live website cannot directly access it. You need to expose it using one of these methods:

#### Option A: Use ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # Or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the public URL** (e.g., `https://abc123.ngrok.io`)

4. **Set in Vercel Environment Variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `LOCAL_SERVER_URL` = `https://abc123.ngrok.io`
   - Redeploy

#### Option B: Use localtunnel

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start tunnel:**
   ```bash
   lt --port 3000
   ```

3. **Copy the public URL** (e.g., `https://xyz.localtunnel.me`)

4. **Set in Vercel Environment Variable:**
   - `LOCAL_SERVER_URL` = `https://xyz.localtunnel.me`
   - Redeploy

#### Option C: Use Cloudflare Tunnel (Free)

1. **Install cloudflared:**
   - Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

2. **Start tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Copy the public URL**

4. **Set in Vercel Environment Variable:**
   - `LOCAL_SERVER_URL` = (the cloudflared URL)
   - Redeploy

### Step 3: Configure Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **node-js-ip-test**
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Key**: `LOCAL_SERVER_URL`
   - **Value**: Your tunnel URL (from Step 2)
   - **Environment**: All
5. Click **Save**

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**

## Testing

1. **Start local server:**
   ```bash
   npm start
   ```

2. **Start tunnel** (ngrok/localtunnel/cloudflared)

3. **Visit live website:** https://node-js-ip-test.vercel.app/

4. **Check connection status:**
   - Look for "🔗 Local Server Connection" section
   - Should show: "✓ Connected to local server"
   - Device Name should show your local computer name (e.g., DESKTOP-3DVN5FM)

## Troubleshooting

### Connection Failed

- **Check local server is running:** Visit `http://192.168.61.55:3000/` in browser
- **Check tunnel is active:** Visit your tunnel URL
- **Check CORS:** Local server has CORS enabled, should work
- **Check firewall:** Make sure port 3000 is not blocked

### Device Name Not Showing

- Verify `LOCAL_SERVER_URL` is set correctly in Vercel
- Check browser console for errors
- Verify `/api/local-device` endpoint works: Visit `http://192.168.61.55:3000/api/local-device`

### Tunnel URL Changes

- **ngrok free:** URL changes each time, update Vercel env var
- **ngrok paid:** Can use custom domain
- **localtunnel:** Can use custom subdomain: `lt --port 3000 --subdomain myname`

## API Endpoint

The local server exposes: `GET /api/local-device`

Response:
```json
{
  "deviceName": "DESKTOP-3DVN5FM",
  "lanIP": "192.168.61.55",
  "platform": "win32",
  "arch": "x64",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "isLocal": true
}
```

## Notes

- The connection is **one-way**: Live website fetches from local server
- Local server must be **running** for the live site to show local data
- If local server is offline, live site shows Vercel server info
- Connection timeout is 5 seconds

