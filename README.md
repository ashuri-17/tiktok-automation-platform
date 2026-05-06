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
