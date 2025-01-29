-- Add missing columns to playerstats table
ALTER TABLE public.playerstats 
ADD COLUMN IF NOT EXISTS cards_collected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_move_refresh TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP; 