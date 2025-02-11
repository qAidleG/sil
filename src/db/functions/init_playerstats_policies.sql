-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE public.playerstats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.playerstats;

-- Create policies
CREATE POLICY "Users can view own stats"
ON public.playerstats FOR SELECT
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can update own stats"
ON public.playerstats FOR UPDATE
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can insert own stats"
ON public.playerstats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

-- Grant necessary permissions
GRANT ALL ON public.playerstats TO authenticated;

-- Grant sequence usage if it exists
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
