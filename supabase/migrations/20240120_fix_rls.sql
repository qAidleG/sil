-- First convert userid columns to UUID type
ALTER TABLE public.playerstats 
  ALTER COLUMN userid TYPE uuid USING userid::uuid;

ALTER TABLE public.gridprogress
  ALTER COLUMN userid TYPE uuid USING userid::uuid;

ALTER TABLE public."UserCollection"
  ALTER COLUMN userid TYPE uuid USING userid::uuid;

-- Enable RLS
ALTER TABLE public.playerstats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gridprogress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserCollection" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.playerstats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.playerstats;

-- Create policies for playerstats
CREATE POLICY "Users can view own stats" 
ON public.playerstats
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can update own stats"
ON public.playerstats
FOR UPDATE
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can insert own stats"
ON public.playerstats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

-- Create policies for UserCollection
CREATE POLICY "Users can view own collection"
ON public."UserCollection"
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can update own collection"
ON public."UserCollection"
FOR UPDATE
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can insert into own collection"
ON public."UserCollection"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

-- Create policies for gridprogress
CREATE POLICY "Users can view own progress"
ON public.gridprogress
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can update own progress"
ON public.gridprogress
FOR UPDATE
TO authenticated
USING (auth.uid() = userid);

CREATE POLICY "Users can insert own progress"
ON public.gridprogress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.playerstats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.gridprogress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."UserCollection" TO authenticated;
GRANT SELECT ON public."Roster" TO authenticated;
GRANT SELECT ON public."Series" TO authenticated; 
