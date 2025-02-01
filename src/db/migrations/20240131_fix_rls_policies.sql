-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to read their own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Allow users to update their own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Allow users to insert their own stats" ON public.playerstats;

-- Enable RLS on playerstats table (in case it's not enabled)
ALTER TABLE public.playerstats ENABLE ROW LEVEL SECURITY;

-- Create policies for playerstats table
CREATE POLICY "Allow users to read their own stats"
ON public.playerstats
FOR SELECT
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Allow users to insert their own stats"
ON public.playerstats
FOR INSERT
TO authenticated
WITH CHECK (userid = auth.uid());

CREATE POLICY "Allow users to update their own stats"
ON public.playerstats
FOR UPDATE
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.playerstats TO authenticated; 