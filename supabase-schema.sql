-- ============================================================
-- TULSA TRUCKS MARKETPLACE - COMPLETE DATABASE SCHEMA
-- ============================================================
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard
--
-- PHOTO UPLOADS: Also add to .env.local:
--   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
-- (Get from Supabase Dashboard > Settings > API)
-- And create Storage bucket "truck-photos" (public) in Dashboard > Storage
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- User profiles (links Supabase Auth to app - for role-based auth)
CREATE TABLE IF NOT EXISTS truck_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE truck_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS truck_email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_truck_email_verification_tokens_token ON truck_email_verification_tokens(token);

-- Admins (existing - admin role determined by email in this table)
CREATE TABLE IF NOT EXISTS truck_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sellers
CREATE TABLE IF NOT EXISTS truck_sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  profile_picture_url TEXT,
  seller_type TEXT CHECK (seller_type IN ('private', 'dealer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id column if not exists (for linking to truck_profiles)
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS seller_type TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS hide_email BOOLEAN DEFAULT false;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT false;

-- Seller reviews (buyers can rate sellers)
CREATE TABLE IF NOT EXISTS truck_seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES truck_sellers(id) ON DELETE CASCADE NOT NULL,
  reviewer_user_id UUID,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_truck_seller_reviews_seller ON truck_seller_reviews(seller_id);

-- Buyers
CREATE TABLE IF NOT EXISTS truck_buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trucks
CREATE TABLE IF NOT EXISTS truck_trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES truck_sellers(id) ON DELETE SET NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER,
  price DECIMAL(12,2) NOT NULL,
  photos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
  description TEXT,
  vin TEXT,
  city TEXT,
  state TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add featured listing columns (safe if already exist)
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
-- Use vehicle_condition (not "condition" - PostgreSQL reserved keyword)
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS vehicle_condition TEXT;
-- Ensure city/state exist (in case table was created from older schema)
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS state TEXT;

-- Saved trucks (Trucks I'm Interested In)
CREATE TABLE IF NOT EXISTS truck_saved_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  truck_id UUID REFERENCES truck_trucks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, truck_id)
);
CREATE INDEX IF NOT EXISTS idx_truck_saved_listings_user ON truck_saved_listings(user_id);

-- ============================================================
-- FINANCING & LEADS
-- ============================================================

-- Financing Requests
CREATE TABLE IF NOT EXISTS truck_financing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES truck_buyers(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES truck_trucks(id) ON DELETE SET NULL,
  down_payment DECIMAL(12,2),
  credit_score INTEGER,
  lender_status TEXT DEFAULT 'pending',
  lead_status TEXT DEFAULT 'new',
  referral_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update lead_status constraint to include all statuses
ALTER TABLE truck_financing_requests DROP CONSTRAINT IF EXISTS truck_financing_requests_lead_status_check;
ALTER TABLE truck_financing_requests ADD CONSTRAINT truck_financing_requests_lead_status_check 
  CHECK (lead_status IN ('new', 'contacted', 'sent_to_lender', 'closed'));

-- Financing Request Notes (CRM)
CREATE TABLE IF NOT EXISTS truck_financing_request_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financing_request_id UUID REFERENCES truck_financing_requests(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financing Request Activity Log (CRM)
CREATE TABLE IF NOT EXISTS truck_financing_request_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financing_request_id UUID REFERENCES truck_financing_requests(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SELLER PLANS (Pro Subscriptions)
-- ============================================================

CREATE TABLE IF NOT EXISTS truck_seller_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES truck_sellers(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  plan_expires TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE truck_seller_plans ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ensure plan_type allows pro_plus and dealer (for existing tables)
ALTER TABLE truck_seller_plans DROP CONSTRAINT IF EXISTS truck_seller_plans_plan_type_check;
ALTER TABLE truck_seller_plans ADD CONSTRAINT truck_seller_plans_plan_type_check 
  CHECK (plan_type IN ('free', 'pro', 'pro_plus', 'dealer'));

-- ============================================================
-- ADS & MARKETING
-- ============================================================

CREATE TABLE IF NOT EXISTS truck_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL CHECK (placement IN ('homepage', 'niche', 'listings', 'truck_detail')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVENUE TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS truck_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('boost', 'seller_plan', 'ad')),
  amount NUMERIC NOT NULL,
  stripe_session_id TEXT,
  truck_id UUID REFERENCES truck_trucks(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES truck_sellers(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES truck_ads(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_truck_payments_type ON truck_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_truck_payments_created ON truck_payments(created_at);

-- ============================================================
-- ADMIN TOOLS
-- ============================================================

-- Tasks/Notes
CREATE TABLE IF NOT EXISTS truck_tasks_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'note' CHECK (type IN ('task', 'note')),
  related_id UUID,
  related_type TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS truck_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGING SYSTEM
-- ============================================================

-- Conversations (threads between users, optionally about a truck)
CREATE TABLE IF NOT EXISTS truck_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID REFERENCES truck_trucks(id) ON DELETE SET NULL,
  participant_1 UUID NOT NULL,  -- user_id from truck_profiles
  participant_2 UUID NOT NULL,  -- user_id from truck_profiles
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_truck_conversations_participant_1 ON truck_conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_truck_conversations_participant_2 ON truck_conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_truck_conversations_last_message ON truck_conversations(last_message_at DESC);

-- Individual messages
CREATE TABLE IF NOT EXISTS truck_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES truck_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,  -- user_id
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_truck_messages_conversation ON truck_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_truck_messages_created ON truck_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_truck_messages_unread ON truck_messages(conversation_id, is_read) WHERE is_read = false;

-- Blocked users (user blocks another user)
CREATE TABLE IF NOT EXISTS truck_blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL,  -- user who is blocking
  blocked_id UUID NOT NULL,  -- user being blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_truck_blocked_users_blocker ON truck_blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_truck_blocked_users_blocked ON truck_blocked_users(blocked_id);

-- Reported messages (for admin moderation)
CREATE TABLE IF NOT EXISTS truck_message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES truck_messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES truck_conversations(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL,  -- user who reported
  reported_user_id UUID NOT NULL,  -- user being reported
  reason TEXT NOT NULL,  -- harassment, spam, scam, inappropriate, other
  details TEXT,  -- additional details from reporter
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_truck_message_reports_status ON truck_message_reports(status);
CREATE INDEX IF NOT EXISTS idx_truck_message_reports_created ON truck_message_reports(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE truck_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_financing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_financing_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_financing_request_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_seller_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_tasks_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_message_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES (Drop if exist, then create)
-- ============================================================

-- Drop existing policies (safe if they don't exist)
DROP POLICY IF EXISTS "truck_allow_all_profiles" ON truck_profiles;
DROP POLICY IF EXISTS "truck_allow_all_email_verification_tokens" ON truck_email_verification_tokens;
DROP POLICY IF EXISTS "truck_public_read_trucks" ON truck_trucks;
DROP POLICY IF EXISTS "truck_public_read_sellers" ON truck_sellers;
DROP POLICY IF EXISTS "truck_public_read_ads" ON truck_ads;
DROP POLICY IF EXISTS "truck_allow_all_admins" ON truck_admins;
DROP POLICY IF EXISTS "truck_allow_all_sellers" ON truck_sellers;
DROP POLICY IF EXISTS "truck_allow_all_buyers" ON truck_buyers;
DROP POLICY IF EXISTS "truck_allow_all_trucks" ON truck_trucks;
DROP POLICY IF EXISTS "truck_allow_all_financing" ON truck_financing_requests;
DROP POLICY IF EXISTS "truck_allow_all_financing_notes" ON truck_financing_request_notes;
DROP POLICY IF EXISTS "truck_allow_all_financing_activity" ON truck_financing_request_activity;
DROP POLICY IF EXISTS "truck_allow_all_seller_plans" ON truck_seller_plans;
DROP POLICY IF EXISTS "truck_allow_all_tasks" ON truck_tasks_notes;
DROP POLICY IF EXISTS "truck_allow_all_ads" ON truck_ads;
DROP POLICY IF EXISTS "truck_allow_all_automation" ON truck_automation_rules;
DROP POLICY IF EXISTS "truck_allow_all_payments" ON truck_payments;
DROP POLICY IF EXISTS "truck_allow_all_seller_reviews" ON truck_seller_reviews;
DROP POLICY IF EXISTS "truck_allow_all_saved_listings" ON truck_saved_listings;
DROP POLICY IF EXISTS "truck_allow_all_conversations" ON truck_conversations;
DROP POLICY IF EXISTS "truck_allow_all_messages" ON truck_messages;
DROP POLICY IF EXISTS "truck_allow_all_blocked_users" ON truck_blocked_users;
DROP POLICY IF EXISTS "truck_allow_all_message_reports" ON truck_message_reports;

-- Create policies
CREATE POLICY "truck_allow_all_profiles" ON truck_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_email_verification_tokens" ON truck_email_verification_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_public_read_trucks" ON truck_trucks FOR SELECT USING (true);
CREATE POLICY "truck_public_read_sellers" ON truck_sellers FOR SELECT USING (true);
CREATE POLICY "truck_public_read_ads" ON truck_ads FOR SELECT USING (true);
CREATE POLICY "truck_allow_all_admins" ON truck_admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_sellers" ON truck_sellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_buyers" ON truck_buyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_trucks" ON truck_trucks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_financing" ON truck_financing_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_financing_notes" ON truck_financing_request_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_financing_activity" ON truck_financing_request_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_seller_plans" ON truck_seller_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_tasks" ON truck_tasks_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_ads" ON truck_ads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_automation" ON truck_automation_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_payments" ON truck_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_seller_reviews" ON truck_seller_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_saved_listings" ON truck_saved_listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_conversations" ON truck_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_messages" ON truck_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_blocked_users" ON truck_blocked_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "truck_allow_all_message_reports" ON truck_message_reports FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET (create manually in Supabase Dashboard)
-- ============================================================
-- For photo uploads: Dashboard > Storage > New bucket
-- Name: truck-photos
-- Public bucket: Yes (so listing images are viewable)
-- ============================================================

-- ============================================================
-- DONE! All truck marketplace tables are ready.
-- ============================================================
