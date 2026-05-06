# TikTok Automation Platform

A free TikTok automation platform where creators earn coins by running a "worker" (Chrome extension) that performs human-like engagement on other users' videos, then spend those coins to get organic views, likes, comments, and follows on their own TikTok videos.

## Like ViewGrip but for TikTok.

### Tech Stack
- **Frontend**: Vite + React + Tailwind CSS (hosted on GitHub Pages - free)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions - free tier)
- **Extension**: Chrome Extension Manifest V3 (Vanilla JS)
- **Total Cost**: $0

### Features
- 50 free starter coins for new users
- Campaign creation (views, likes, comments, follows)
- Chrome extension worker with human-like automation
- Coin-based economy
- Anti-fraud detection
- Real-time dashboard
- No admin approval needed (instant campaigns)

### Quick Start
1. Clone the repo
2. Setup Supabase project (see `supabase/schema.sql`)
3. Configure `web-dashboard/.env`
4. Run `npm install` in `web-dashboard/`
5. Run `npm run dev` for local development

## Deployment

### 1. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Deploy Edge Functions: `supabase functions deploy`
4. Get your project URL and anon key from Project Settings

### 2. Web Dashboard (GitHub Pages)
1. Update `web-dashboard/.env.production` with your Supabase credentials
2. Run `npm run deploy` in the `web-dashboard/` directory
3. Your dashboard will be live at: `https://YOUR_USERNAME.github.io/tiktok-automation-platform/`

### 3. Chrome Extension
1. Update `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in:
   - `chrome-extension/background/background.js`
   - `chrome-extension/popup/popup.js`
2. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer Mode"
   - Click "Load unpacked" and select the `chrome-extension/` folder
3. (Optional) Publish to Chrome Web Store

### 4. Push to GitHub
```bash
git add .
git commit -m "feat: complete TikTok automation platform - ready for deployment"
git push origin main
```
