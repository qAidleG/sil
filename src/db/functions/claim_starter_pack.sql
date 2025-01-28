CREATE OR REPLACE FUNCTION public.claim_starter_pack(
  p_userid uuid,
  p_character_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user already has cards
  IF EXISTS (
    SELECT 1 FROM public."UserCollection"
    WHERE userid = p_userid
  ) THEN
    RETURN false;
  END IF;

  -- Add characters to user's collection
  INSERT INTO public."UserCollection" (userid, characterid)
  SELECT p_userid, unnest(p_character_ids);

  -- Update player stats
  UPDATE public.playerstats
  SET 
    cards_collected = cards_collected + array_length(p_character_ids, 1),
    gold = gold + 100  -- Bonus gold for new players
  WHERE userid = p_userid;

  RETURN true;
END;
$$; 