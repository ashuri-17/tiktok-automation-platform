-- Complete database schema for TikTok Automation Platform
-- Idempotent — safe to re-run on an existing project.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════
-- Drop phase — remove existing policies/triggers
-- so the script can be re-run safely
-- ═══════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own profile"      ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can view own campaigns"     ON public.campaigns;
DROP POLICY IF EXISTS "Users can create own campaigns"   ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns"   ON public.campaigns;
DROP POLICY IF EXISTS "Workers can view pending tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Workers can update assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view own transactions"  ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can view all profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all campaigns"    ON public.campaigns;
DROP POLICY IF EXISTS "Admins can view all tasks"        ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can view all logs"         ON public.worker_logs;
DROP POLICY IF EXISTS "Admins can manage admin_logs"    ON public.admin_logs;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ═══════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  tiktok_username TEXT,
  coins INTEGER DEFAULT 0 CHECK (coins >= 0),
  worker_status TEXT DEFAULT 'stopped' CHECK (worker_status IN ('stopped','running','banned')),
  ip_address TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 3. Tasks (individual work units)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view','like','comment','follow')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','assigned','completed','failed')),
  watch_time INTEGER,
  comment_text TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campaign Comments
CREATE TABLE IF NOT EXISTS public.campaign_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  used_count INTEGER DEFAULT 0
);

-- 5. Worker Logs
CREATE TABLE IF NOT EXISTS public.worker_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Coin Transactions (audit trail)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn_view','earn_like','earn_comment','earn_follow','spend_campaign','bonus_signup')),
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_logs_worker_id ON worker_logs(worker_id);

-- ═══════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════

-- Atomic coin transaction function
CREATE OR REPLACE FUNCTION public.process_coin_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_task_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL
) RETURNS TABLE(new_balance INTEGER) AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT coins INTO current_balance FROM public.profiles WHERE id = p_user_id;
  IF current_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  UPDATE public.profiles SET coins = coins + p_amount, updated_at = NOW() WHERE id = p_user_id;
  INSERT INTO public.coin_transactions (user_id, amount, type, task_id, campaign_id, balance_after)
    VALUES (p_user_id, p_amount, p_type, p_task_id, p_campaign_id, current_balance + p_amount);
  RETURN QUERY SELECT (current_balance + p_amount)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New user signup trigger (50 free coins)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', FALSE);

  INSERT INTO public.coin_transactions (user_id, amount, type, balance_after)
  VALUES (NEW.id, 50, 'bonus_signup', 50);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: requeue stale tasks
CREATE OR REPLACE FUNCTION public.requeue_stale_tasks()
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET status = 'pending', worker_id = NULL, assigned_at = NULL
  WHERE status = 'assigned'
    AND assigned_at < NOW() - INTERVAL '5 minutes'
    AND completed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: increment campaign delivered
CREATE OR REPLACE FUNCTION public.increment_campaign_delivered(
  p_campaign_id UUID,
  p_field TEXT,
  p_amount INTEGER
) RETURNS void AS $$
BEGIN
  IF p_field = 'views_delivered' THEN
    UPDATE public.campaigns SET views_delivered = views_delivered + p_amount WHERE id = p_campaign_id;
  ELSIF p_field = 'likes_delivered' THEN
    UPDATE public.campaigns SET likes_delivered = likes_delivered + p_amount WHERE id = p_campaign_id;
  ELSIF p_field = 'comments_delivered' THEN
    UPDATE public.campaigns SET comments_delivered = comments_delivered + p_amount WHERE id = p_campaign_id;
  ELSIF p_field = 'follows_delivered' THEN
    UPDATE public.campaigns SET follows_delivered = follows_delivered + p_amount WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin check function (bypasses RLS to prevent infinite recursion in policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Workers can view pending tasks" ON public.tasks
  FOR SELECT USING (status = 'pending' OR worker_id = auth.uid());
CREATE POLICY "Workers can update assigned tasks" ON public.tasks
  FOR UPDATE USING (worker_id = auth.uid());

-- Coin transactions policies
CREATE POLICY "Users can view own transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all campaigns" ON public.campaigns
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all tasks" ON public.tasks
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all transactions" ON public.coin_transactions
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view all logs" ON public.worker_logs
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage admin_logs" ON public.admin_logs
  FOR ALL USING (public.is_admin());

-- ═══════════════════════════════════════════════
-- Migration: add ON DELETE CASCADE to existing FKs
-- (safe to re-run; errors mean constraint was already updated)
-- ═══════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_id_fkey,
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.campaigns
    DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey,
    ADD CONSTRAINT campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_campaign_id_fkey,
    ADD CONSTRAINT tasks_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_worker_id_fkey,
    ADD CONSTRAINT tasks_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.campaign_comments
    DROP CONSTRAINT IF EXISTS campaign_comments_campaign_id_fkey,
    ADD CONSTRAINT campaign_comments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.worker_logs
    DROP CONSTRAINT IF EXISTS worker_logs_worker_id_fkey,
    ADD CONSTRAINT worker_logs_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.worker_logs
    DROP CONSTRAINT IF EXISTS worker_logs_task_id_fkey,
    ADD CONSTRAINT worker_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.coin_transactions
    DROP CONSTRAINT IF EXISTS coin_transactions_user_id_fkey,
    ADD CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.coin_transactions
    DROP CONSTRAINT IF EXISTS coin_transactions_task_id_fkey,
    ADD CONSTRAINT coin_transactions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.coin_transactions
    DROP CONSTRAINT IF EXISTS coin_transactions_campaign_id_fkey,
    ADD CONSTRAINT coin_transactions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_logs
    DROP CONSTRAINT IF EXISTS admin_logs_admin_id_fkey,
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_logs
    DROP CONSTRAINT IF EXISTS admin_logs_target_user_id_fkey,
    ADD CONSTRAINT admin_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_logs
    DROP CONSTRAINT IF EXISTS admin_logs_campaign_id_fkey,
    ADD CONSTRAINT admin_logs_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
