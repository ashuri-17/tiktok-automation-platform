# TikTok Automation Platform - Design Spec

**Date:** 2026-05-06
**Project:** TikTok Worker Platform (ViewGrip clone for TikTok)
**Status:** Approved (brainstorming phase complete)

---

## 1. Overview

A free TikTok automation platform where creators earn coins by running a "worker" (Chrome extension) that performs human-like engagement on other users' videos, then spend those coins to get organic views, likes, comments, and follows on their own TikTok videos.

**Like ViewGrip but for TikTok.** Completely free to use. Built with Vite + React + Supabase + Chrome Extension (Manifest V3).

---

## 2. Architecture

### 2.1 Tech Stack

| Component | Technology | Hosting | Cost |
|-----------|------------|---------|------|
| Frontend Dashboard | Vite + React + Tailwind CSS | GitHub Pages | Free |
| Backend API | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) | Supabase Cloud | Free tier (500MB DB, 50K MAU) |
| Browser Extension | Chrome Extension Manifest V3 (Vanilla JS) | Chrome Web Store (or manual install) | Free |
| Database | PostgreSQL (via Supabase) | Supabase | Free tier |
| Auth | Supabase Auth (email + OAuth) | Supabase | Included |
| Realtime | Supabase Realtime | Supabase | Included |

### 2.2 System Architecture

```
TikTokers ──→ Web Dashboard (Vite + React, GitHub Pages)
    │
    ├──→ Chrome Extension (Manifest V3)
    │       ├── Login (QR Code or In-Extension)
    │       ├── Worker (fetches tasks, performs human-like actions)
    │       └── Reports completion → earns coins
    │
    └──→ Supabase Backend
            ├── PostgreSQL (profiles, campaigns, tasks, transactions)
            ├── Auth (user management)
            ├── Realtime (live progress updates)
            └── Edge Functions (task distribution, coin transactions, fraud detection)
                    │
                    └──→ TikTok (web interface automation)
```

### 2.3 User Journey

1. **Sign Up** → User creates account via Supabase Auth → **Gets 50 free starter coins**
2. **Create Campaign** → Paste TikTok video URL, configure actions (views/likes/comments/follows), set coin budget
3. **Campaign Goes Live** → No admin approval needed (like ViewGrip) → tasks generated instantly
4. **Launch Worker** → Install Chrome extension → Login to TikTok (QR or in-extension) → Click "Start Worker"
5. **Earn Coins** → Extension auto-watches others' videos with human-like behavior → Reports completion → Earns coins
6. **Get Views** → Other workers pick up user's campaign tasks → Organic engagement delivered

---

## 3. Database Schema

### 3.1 Tables

**profiles** (extends Supabase `auth.users`)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  tiktok_username TEXT,
  coins INTEGER DEFAULT 0 CHECK (coins >= 0),
  worker_status TEXT DEFAULT 'stopped' CHECK (worker_status IN ('stopped','running','banned')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**campaigns**
```sql
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  video_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  views_target INTEGER DEFAULT 0,
  views_delivered INTEGER DEFAULT 0,
  likes_target INTEGER DEFAULT 0,
  likes_delivered INTEGER DEFAULT 0,
  comments_target INTEGER DEFAULT 0,
  comments_delivered INTEGER DEFAULT 0,
  follows_target INTEGER DEFAULT 0,
  follows_delivered INTEGER DEFAULT 0,
  watch_time_min INTEGER DEFAULT 5,
  watch_time_max INTEGER DEFAULT 30,
  geo_target TEXT[],
  speed_limit INTEGER DEFAULT 10,
  daily_limit INTEGER DEFAULT 100,
  coins_budget INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**tasks** (individual work units)
```sql
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  worker_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('view','like','comment','follow')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','assigned','completed','failed')),
  watch_time INTEGER,
  comment_text TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**campaign_comments** (pre-written comments)
```sql
CREATE TABLE public.campaign_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  text TEXT NOT NULL,
  used_count INTEGER DEFAULT 0
);
```

**worker_logs**
```sql
CREATE TABLE public.worker_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) NOT NULL,
  task_id UUID REFERENCES public.tasks(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**coin_transactions** (audit trail - prevents coin theft)
```sql
CREATE TABLE public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn_view','earn_like','earn_comment','earn_follow','spend_campaign','bonus_signup')),
  task_id UUID REFERENCES public.tasks(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**admin_logs**
```sql
CREATE TABLE public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS)

- Users can read/update own profile only
- Users can CRUD own campaigns only
- Workers can read pending tasks (with geo filtering)
- Workers can update tasks assigned to them only
- Users can read own coin transactions only
- Admin role can read all tables

### 3.3 New User Bonus

Trigger: On new user signup → insert `coin_transactions` with `+50` coins, type `bonus_signup`.

---

## 4. Coin System (Hybrid Model)

### 4.1 Earning Rates (Worker completes tasks)

| Action | Base Coins | Time Bonus | Total Range |
|--------|-------------|-------------|---------------|
| View (5-30s) | 1 | +1 per 10s watched | 1-4 coins |
| Like | 2 | - | 2 coins |
| Comment | 5 | - | 5 coins |
| Follow | 10 | - | 10 coins |

### 4.2 Spending Rates (Campaign creator pays)

Same rates as earning. If a worker earns 2 coins for a like, the campaign creator pays 2 coins.

### 4.3 Atomic Transactions

All coin changes happen via Supabase Edge Function `coin-transaction` → PostgreSQL stored procedure. Extension cannot fake coin earnings.

```sql
CREATE OR REPLACE FUNCTION process_coin_transaction(
  p_user_id UUID, p_amount INTEGER, p_type TEXT,
  p_task_id UUID DEFAULT NULL, p_campaign_id UUID DEFAULT NULL
) RETURNS TABLE(new_balance INTEGER) AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT coins INTO current_balance FROM profiles WHERE id = p_user_id;
  IF current_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  UPDATE profiles SET coins = coins + p_amount WHERE id = p_user_id;
  INSERT INTO coin_transactions (user_id, amount, type, task_id, campaign_id, balance_after)
    VALUES (p_user_id, p_amount, p_type, p_task_id, p_campaign_id, current_balance + p_amount);
  RETURN QUERY SELECT (current_balance + p_amount)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Chrome Extension (The Worker)

### 5.1 Directory Structure

```
tiktok-worker-extension/
├── manifest.json          # MV3 manifest
├── popup/
│   ├── popup.html        # Worker control panel
│   ├── popup.js          # Popup logic
│   └── popup.css        # Styles
├── background/
│   └── background.js    # Service worker - task polling, state management
├── content/
│   ├── content.js        # Injected into TikTok tabs - performs automation
│   ├── human-behavior.js # Mouse movements, scroll patterns, timing
│   └── tiktok-parser.js # Extract video ID, user info from TikTok pages
├── auth/
│   ├── login.js          # In-extension TikTok login flow
│   └── qr-login.js      # QR code login (like TikTok web)
├── utils/
│   ├── api.js            # Supabase API calls
│   ├── coin-tracker.js   # Track earned coins
│   └── logger.js        # Worker activity logs
└── assets/
    └── icons/            # Extension icons
```

### 5.2 Popup UI

```
┌─────────────────────────┐
│  TikTok Worker    ●    │  (● = green dot when running)
├─────────────────────────┤
│ Worker Status: RUNNING  │
│ Tasks Done: 42          │
│ Coins Earned: 156       │
│ Current: Watching...    │
├─────────────────────────┤
│ [ ▶ Start Worker ]     │
│ [ ■ Stop Worker ]      │
├─────────────────────────┤
│ Login Status: ✓ Logged  │
│ [ Switch Account ]      │
├─────────────────────────┤
│ Actions: ✓ Views       │
│          ✓ Likes        │
│          ✓ Comments     │
│          ✓ Follows      │
└─────────────────────────┘
```

### 5.3 Background Service Worker

- Manages worker state (running/stopped)
- Polls `task-distribute` Edge Function every 30 seconds
- Creates new tab with TikTok video URL when task received
- Injects content script into TikTok tab
- Listens for completion message from content script
- Reports completion to `task-complete` Edge Function
- Updates coin balance in storage

### 5.4 Content Script (Automation Engine)

**Watch Behavior:**
- Random watch time between campaign `watch_time_min` and `watch_time_max`
- Simulate human watching: sometimes pause/resume, scroll while watching, mute/unmute
- Keyboard "distractions" (blur/focus events)
- 30% chance to browse TikTok feed for 5-15 seconds before watching target video

**Mouse Movement:**
- Bezier curve paths (not straight lines)
- 2% chance per second of micro-movements while watching
- Sometimes "miss" like button and correct

**Scroll Simulation:**
- Visit TikTok home/feed first (30% chance)
- Scroll through 2-5 videos before clicking target
- Sometimes click profile first, then watch video
- After watching, scroll feed for 5-15 seconds

**Comment Typing:**
- Type character by character with variable speed (80-200ms per character)
- 5% chance of "typo" that gets corrected
- Use campaign's comment pool, fallback to built-in pool of 50+ organic comments

**Action Flow:**
1. Open TikTok video URL in new tab
2. Wait for page load
3. Scroll page naturally (simulate reading description)
4. Click play if not auto-playing
5. Watch for random duration (5-30s)
6. Perform configured actions (like, comment, follow)
7. Scroll feed briefly
8. Close tab
9. Report completion to background script

### 5.5 Auth Module

**Option A: QR Code Login**
- Extension displays QR code from `tiktok.com/qr-login`
- User scans with TikTok mobile app
- Extension captures session cookies from redirected page
- Saves to `chrome.storage`

**Option B: In-Extension Login**
- Popup shows TikTok login form
- User logs in within extension
- Cookies saved to `chrome.storage`

Both methods store session cookies for use in worker tabs.

---

## 6. Web Dashboard

### 6.1 Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Stats overview, quick actions, active campaigns table |
| Create Campaign | `/campaigns/new` | Paste TikTok URL, configure actions/budget |
| My Campaigns | `/campaigns` | List all campaigns with progress bars |
| Launch Worker | `/worker` | Extension download, worker status, live stats |
| Coin Manager | `/coins` | Balance, transaction history, referral link |
| Profile | `/profile` | Username, TikTok handle, settings |

### 6.2 Dashboard Layout

- **Sidebar:** Navigation (Dashboard, Campaigns, Worker, Coins, Profile, Extension Download)
- **Stats Cards:** Total Views, Total Likes, Coin Balance, Active Campaigns
- **Quick Actions:** "Create Campaign" button, "Launch Worker" button
- **Active Campaigns Table:** Video title, type, progress bar, spent coins, status
- **Realtime Updates:** Via Supabase Realtime subscriptions

### 6.3 Campaign Creator Form

- TikTok video URL input (auto-extracts video ID)
- Action checkboxes: Views, Likes, Comments, Follows
- Watch time range sliders (min 5s - max 30s)
- Daily/hourly speed limits
- Coin budget input
- Comments pool textarea (one per line)
- Geo-targeting multi-select (optional)

---

## 7. Supabase Edge Functions

### 7.1 Function List

| Function | Method | Purpose |
|----------|--------|---------|
| `task-distribute` | GET | Worker fetches next pending task (with geo-matching) |
| `task-complete` | POST | Worker reports completed task → triggers coin transaction |
| `campaign-create` | POST | User creates campaign → validates, generates tasks |
| `coin-transaction` | POST | Atomic coin debit/credit (server-side only) |
| `fraud-detect` | POST | Analyze worker behavior for bot detection |
| `worker-stats` | GET | Return worker stats for dashboard |

### 7.2 Task Distribution Logic

1. Worker polls `task-distribute` with their `worker_id` and `ip_address`
2. Function finds pending tasks where:
   - `status = 'pending'`
   - `geo_target` matches worker's region (if specified)
   - Not assigned to another worker
3. Marks task as `assigned`, sets `worker_id` and `assigned_at`
4. If `assigned_at` > 5 minutes ago and not completed → re-queue task
5. Returns task details to worker

### 7.3 Anti-Fraud System (Server-Side)

All checks run in `fraud-detect` Edge Function:

| Check | Action |
|-------|--------|
| IP not unique (duplicate) | Ban worker ("Duplicate IP") |
| Watch time stddev < 1.0 over 20+ tasks | Flag ("Bot behavior") |
| Actions per minute > 10 | Temp ban 1 hour |
| Zero mousemove events over 15+ tasks | Flag ("No human movement") |
| Sudden country change in IP | Ban ("VPN detected") |
| Task completion < 10 seconds | Reject task, no coins |

---

## 8. Admin Panel

Accessible to admin users only (role in `profiles` table).

| Feature | Description |
|---------|-------------|
| User Management | View all users, ban/unban, adjust coin balance |
| Campaign Monitoring | View all campaigns, remove inappropriate ones |
| Worker Logs | View worker activity, detect fraud patterns |
| Coin Audit | View all transactions, investigate discrepancies |
| Analytics | Total users, coins in circulation, tasks completed |

Note: Unlike ViewGrip, campaigns do NOT require admin approval before going live. Admin panel is for after-the-fact moderation only.

---

## 9. Implementation Order

1. Initialize project repo (GitHub)
2. Setup Supabase project (DB schema, RLS, Edge Functions, Auth)
3. Build Web Dashboard (Vite + React + Tailwind)
   - Auth flow
   - Dashboard home
   - Campaign creator
   - Campaign list with progress
   - Coin manager
   - Worker launcher page
4. Build Chrome Extension (Manifest V3)
   - Manifest + popup UI
   - Background service worker
   - Content script with human-like automation
   - Auth module (QR + in-extension login)
   - API module (Supabase calls)
5. Build Admin Panel
6. Deploy (GitHub Pages + Supabase)
7. Push to GitHub repo

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-------------|
| No admin approval for campaigns | Matches ViewGrip UX - instant gratification |
| 50 free starter coins | Users can test platform immediately without working first |
| Hybrid coin model | Time-based for views + action-based for likes/comments/follows |
| Server-side coin transactions | Prevents extension JS tampering / coin theft |
| Manifest V3 for extension | Future-proof (MV2 being deprecated) |
| Hybrid auth (QR + in-extension) | Best UX - QR for mobile users, form for desktop |
| Geo-targeting in task distribution | Matches workers to campaigns from same region when possible |
| GitHub Pages + Supabase | $0 total cost, generous free tiers |
| Anti-fraud in Edge Functions | Cannot be bypassed by modifying extension code |
| Realtime via Supabase | Live campaign progress updates on dashboard |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| TikTok detects automation | Human-like behavior simulation (mouse, scroll, timing variance) |
| TikTok changes web interface | Extension content script needs periodic updates; use robust CSS selectors |
| Users cheat (modify extension) | Server-side validation for all coin transactions |
| Supabase free tier limits | Can upgrade to paid if needed; 500MB DB is generous for initial users |
| Campaign spam (inappropriate content) | Admin panel for after-the-fact removal + user banning |
