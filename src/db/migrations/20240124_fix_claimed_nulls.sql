-- Update any NULL claimed values to false
UPDATE public.Roster
SET claimed = false
WHERE claimed IS NULL; 