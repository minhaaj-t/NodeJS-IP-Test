# Deploy to Vercel

This guide will help you deploy the Device Info Display application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for command line deployment)
3. Git repository (optional, for GitHub integration)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure the project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (current directory)
   - Build Command: Leave empty (no build needed)
   - Output Directory: Leave empty
   - Install Command: `npm install`

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No**
   - Project name? (Enter a name or press Enter for default)
   - Directory? (Press Enter for current directory)

5. **Production deployment**:
   ```bash
   vercel --prod
   ```

## Project Configuration

The project is already configured with:
- ✅ `vercel.json` - Vercel configuration file
- ✅ `server.js` - Exported Express app for Vercel
- ✅ `.gitignore` - Excludes node_modules and other files

## Environment Variables

No environment variables are required for this project. The app will automatically:
- Use Vercel's provided PORT (if available)
- Detect client IPs from request headers
- Work with Vercel's serverless functions

## Post-Deployment

After deployment:
1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. The app will automatically detect:
   - Server information (Vercel server's hostname and IP)
   - Client information (visitor's IP, device info, etc.)

## Troubleshooting

### If deployment fails:
1. Check that `package.json` has all dependencies listed
2. Ensure `server.js` exports the Express app (`module.exports = app`)
3. Verify `vercel.json` is correctly configured

### If the app doesn't work:
1. Check Vercel function logs in the dashboard
2. Verify the routes are correctly configured in `vercel.json`
3. Test locally first with `npm start`

## Notes

- The app runs as a serverless function on Vercel
- Server device name will show Vercel's server hostname
- Client IP detection works through Vercel's proxy headers
- WebRTC for local IP detection may have limitations in serverless environments

