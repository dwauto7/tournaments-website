-- Add airtable_record_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS airtable_record_id TEXT;