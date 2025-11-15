# How to Display Your Local Device Name on Live Website

Your local device name is: **DESKTOP-3DVN5FM**

To display this on the live website (https://node-js-ip-test.vercel.app/), follow these steps:

## Step 1: Get Your Local Device Name

Your local device name is already detected: **DESKTOP-3DVN5FM**

If you need to check it again, run:
```bash
node -e "console.log(require('os').hostname())"
```

## Step 2: Set Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **node-js-ip-test**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:
   - **Key**: `DEVICE_NAME`
   - **Value**: `DESKTOP-3DVN5FM` (or your actual device name)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

## Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeploy

## Step 4: Verify

Visit https://node-js-ip-test.vercel.app/ and check the **Server Information** section. The **Device Name** should now show: **DESKTOP-3DVN5FM**

## Alternative: Update via Vercel CLI

```bash
npx vercel env add DEVICE_NAME
# When prompted, enter: DESKTOP-3DVN5FM
# Select all environments
```

Then redeploy:
```bash
npx vercel --prod
```

## How It Works

- **Local**: Uses `os.hostname()` automatically (shows your computer name)
- **Live**: Checks `DEVICE_NAME` environment variable first, then falls back to server hostname
- If `DEVICE_NAME` is set in Vercel, it will display that name on the live website

