CREATE OR REPLACE FUNCTION public.claim_starter_pack(
  p_userid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_character_ids uuid[];
BEGIN
  -- Check if user already has cards
  IF EXISTS (
    SELECT 1 FROM public."UserCollection"
    WHERE userid = p_userid
  ) THEN
    RETURN false;
  END IF;

  -- Get 3 random unclaimed characters (rarity 4-6)
  WITH available_characters AS (
    SELECT characterid
    FROM public."Roster" c
    WHERE 
      -- Check rarity range
      rarity BETWEEN 4 AND 6
      -- Check if character is unclaimed
      AND NOT EXISTS (
        SELECT 1 
        FROM public."UserCollection" uc 
        WHERE uc.characterid = c.characterid
      )
    ORDER BY RANDOM()
    LIMIT 3
  )
  SELECT array_agg(characterid) INTO v_character_ids
  FROM available_characters;

  -- Make sure we got enough characters
  IF array_length(v_character_ids, 1) < 3 THEN
    RETURN false;
  END IF;

  -- Add characters to user's collection
  INSERT INTO public."UserCollection" (userid, characterid)
  SELECT p_userid, unnest(v_character_ids);

  -- Update player stats
  UPDATE public.playerstats
  SET 
    cards_collected = cards_collected + array_length(v_character_ids, 1),
    gold = gold + 100  -- Bonus gold for new players
  WHERE userid = p_userid;

  RETURN true;
END;
$$; 