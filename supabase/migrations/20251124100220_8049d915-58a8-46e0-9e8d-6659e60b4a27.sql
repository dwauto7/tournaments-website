-- Add phone and handicap columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN handicap NUMERIC;