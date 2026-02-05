-- Fix: "condition" is a PostgreSQL reserved keyword, causing updates to fail silently.
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_trucks' AND column_name = 'condition'
  ) THEN
    ALTER TABLE truck_trucks RENAME COLUMN condition TO vehicle_condition;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'truck_trucks' AND column_name = 'vehicle_condition'
  ) THEN
    ALTER TABLE truck_trucks ADD COLUMN vehicle_condition TEXT;
  END IF;
END $$;
