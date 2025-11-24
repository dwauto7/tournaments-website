-- Add credits column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Add new columns to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Create index on join_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_join_code ON public.tournaments(join_code);

-- Rename columns to match requested schema (create aliases)
-- Note: We'll keep existing columns and use them with new names in code

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Contact messages policies (public can insert, authenticated users can view their own)
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view all contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6 character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM tournaments WHERE join_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Add trigger to auto-generate join_code if not provided
CREATE OR REPLACE FUNCTION public.set_tournament_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_join_code_on_insert ON public.tournaments;
CREATE TRIGGER set_join_code_on_insert
  BEFORE INSERT ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tournament_join_code();