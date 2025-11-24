-- Create RPC function for tournament creation
CREATE OR REPLACE FUNCTION public.create_tournament(
  p_name TEXT,
  p_start_datetime TIMESTAMPTZ,
  p_description TEXT DEFAULT NULL,
  p_game TEXT DEFAULT 'General',
  p_location TEXT DEFAULT 'Online',
  p_max_participants INTEGER DEFAULT 16,
  p_prize_pool TEXT DEFAULT NULL,
  p_rules TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id UUID;
  v_join_code TEXT;
  v_creator_id UUID;
  v_webhook_url TEXT;
BEGIN
  -- Get current user
  v_creator_id := auth.uid();
  
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Generate join code
  v_join_code := generate_join_code();
  
  -- Insert tournament
  INSERT INTO public.tournaments (
    title,
    description,
    game,
    location,
    max_participants,
    start_datetime,
    prize_pool,
    rules,
    created_by,
    join_code
  ) VALUES (
    p_name,
    p_description,
    p_game,
    p_location,
    p_max_participants,
    p_start_datetime,
    p_prize_pool,
    p_rules,
    v_creator_id,
    v_join_code
  ) RETURNING id INTO v_tournament_id;
  
  -- Trigger n8n webhook if configured
  BEGIN
    SELECT decrypted_secret INTO v_webhook_url
    FROM vault.decrypted_secrets
    WHERE name = 'N8N_WEBHOOK_URL'
    LIMIT 1;
    
    IF v_webhook_url IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'tournament_id', v_tournament_id,
          'name', p_name,
          'start_datetime', p_start_datetime,
          'creator_id', v_creator_id
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail tournament creation if webhook fails
    RAISE NOTICE 'Webhook notification failed: %', SQLERRM;
  END;
  
  -- Return tournament data
  RETURN json_build_object(
    'success', true,
    'tournament', json_build_object(
      'id', v_tournament_id,
      'title', p_name,
      'join_code', v_join_code,
      'start_datetime', p_start_datetime
    )
  );
END;
$$;

-- Create RPC function for joining tournaments
CREATE OR REPLACE FUNCTION public.join_tournament(
  p_join_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id UUID;
  v_user_id UUID;
  v_tournament_status TEXT;
  v_max_participants INTEGER;
  v_current_count INTEGER;
  v_already_joined BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate join code format
  IF p_join_code IS NULL OR LENGTH(TRIM(p_join_code)) = 0 THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;
  
  -- Find tournament by join code
  SELECT id, status, max_participants
  INTO v_tournament_id, v_tournament_status, v_max_participants
  FROM public.tournaments
  WHERE join_code = UPPER(TRIM(p_join_code));
  
  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;
  
  -- Check tournament status
  IF v_tournament_status != 'upcoming' THEN
    RAISE EXCEPTION 'Tournament is not accepting participants';
  END IF;
  
  -- Check if already joined
  SELECT EXISTS(
    SELECT 1 FROM public.tournament_participants
    WHERE tournament_id = v_tournament_id AND user_id = v_user_id
  ) INTO v_already_joined;
  
  IF v_already_joined THEN
    RAISE EXCEPTION 'Already joined this tournament';
  END IF;
  
  -- Check participant count
  SELECT COUNT(*) INTO v_current_count
  FROM public.tournament_participants
  WHERE tournament_id = v_tournament_id;
  
  IF v_current_count >= v_max_participants THEN
    RAISE EXCEPTION 'Tournament is full';
  END IF;
  
  -- Join tournament
  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (v_tournament_id, v_user_id);
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'message', 'Successfully joined tournament'
  );
END;
$$;