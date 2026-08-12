-- Migration: 001_plans_and_usage.sql
-- Description: Creates the plans and user_subscriptions tables for dynamic usage tracking

-- 1. Create Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text UNIQUE NOT NULL, -- 'free', 'pro_monthly', 'pro_yearly'
  display_name text NOT NULL,
  
  -- Quotas
  quota_scans_per_month integer NOT NULL DEFAULT 10,
  quota_chat_messages_per_month integer NOT NULL DEFAULT 20,
  quota_vault_documents integer NOT NULL DEFAULT 0,
  quota_active_share_links integer NOT NULL DEFAULT 1,
  
  -- Capabilities (Entitlements)
  cap_vault boolean NOT NULL DEFAULT false,
  cap_reanalysis boolean NOT NULL DEFAULT false,
  cap_all_languages boolean NOT NULL DEFAULT false,
  cap_export boolean NOT NULL DEFAULT false,
  cap_share boolean NOT NULL DEFAULT true,
  cap_priority_support boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Insert Default Plans
INSERT INTO public.plans 
  (tier_name, display_name, quota_scans_per_month, quota_chat_messages_per_month, quota_vault_documents, quota_active_share_links, cap_vault, cap_reanalysis, cap_all_languages, cap_export, cap_share, cap_priority_support)
VALUES 
  ('free', 'Free', 10, 20, 0, 1, false, false, false, false, true, false),
  ('pro_monthly', 'Pro Monthly', 60, 200, 500, 25, true, true, true, true, true, false),
  ('pro_yearly', 'Pro Yearly', 75, 300, 2000, 50, true, true, true, true, true, true)
ON CONFLICT (tier_name) DO NOTHING;

-- 3. Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans NOT NULL,
  
  status text NOT NULL DEFAULT 'active',
  
  -- Usage Tracking
  scans_used integer NOT NULL DEFAULT 0,
  chat_messages_used integer NOT NULL DEFAULT 0,
  
  -- Reset Tracking
  usage_reset_at timestamptz NOT NULL,
  current_period_end timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Plans: Everyone can read plans (needed for pricing pages/UI)
CREATE POLICY "Plans are viewable by everyone" 
ON public.plans FOR SELECT 
USING (true);

-- Subscriptions: Users can only read their own subscription
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Subscriptions: Service Role can do everything (for webhooks, admin tasks)
-- Note: Subscriptions update (for usage increments) will be done via server actions using service_role key

-- 6. Trigger to auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Get the Free plan ID
  SELECT id INTO free_plan_id FROM public.plans WHERE tier_name = 'free' LIMIT 1;
  
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, usage_reset_at)
    VALUES (
      NEW.id, 
      free_plan_id, 
      date_trunc('month', now() + interval '1 month') -- First day of next month
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
