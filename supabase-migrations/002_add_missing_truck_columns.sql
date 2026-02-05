-- Add any missing columns to truck_trucks and truck_sellers
-- Run in Supabase SQL Editor: https://supabase.com/dashboard
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE truck_trucks ADD COLUMN IF NOT EXISTS vehicle_condition TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE truck_sellers ADD COLUMN IF NOT EXISTS state TEXT;
