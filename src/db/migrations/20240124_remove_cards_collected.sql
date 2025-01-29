-- Remove redundant cards_collected column from playerstats
ALTER TABLE public.playerstats DROP COLUMN IF EXISTS cards_collected;

-- Drop the increment_cards_collected function if it exists
DROP FUNCTION IF EXISTS increment_cards_collected(); 