-- Migration to remove redundant turns field
-- First, verify moves has the correct values
UPDATE public.playerstats
SET moves = GREATEST(moves, turns)
WHERE moves != turns;

-- Then remove the turns column
ALTER TABLE public.playerstats DROP COLUMN turns;

-- Ensure moves has proper constraints
ALTER TABLE public.playerstats 
  ALTER COLUMN moves SET DEFAULT 30,
  ADD CONSTRAINT moves_range CHECK (moves >= 0 AND moves <= 30); 