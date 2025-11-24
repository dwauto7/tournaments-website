-- Rename start_date to start_datetime for clarity
ALTER TABLE public.tournaments
RENAME COLUMN start_date TO start_datetime;

-- Ensure the column is timestamptz (it should already be, but let's be explicit)
ALTER TABLE public.tournaments
ALTER COLUMN start_datetime TYPE TIMESTAMPTZ;

-- Add comment for clarity
COMMENT ON COLUMN public.tournaments.start_datetime IS 'Tournament start date and time with timezone';