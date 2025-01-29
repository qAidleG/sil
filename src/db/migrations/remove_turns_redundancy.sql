-- Remove turns column from playerstats
ALTER TABLE public.playerstats DROP COLUMN turns;

-- Ensure moves has proper constraints
ALTER TABLE public.playerstats 
  ALTER COLUMN moves SET DEFAULT 30,
  ADD CONSTRAINT moves_range CHECK (moves >= 0 AND moves <= 30); 