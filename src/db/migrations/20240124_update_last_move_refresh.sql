-- Drop and recreate last_move_refresh column with timestamptz
ALTER TABLE public.playerstats 
DROP COLUMN IF EXISTS last_move_refresh,
ADD COLUMN last_move_refresh TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP; 