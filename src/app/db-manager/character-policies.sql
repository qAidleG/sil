-- Enable RLS on Character table
ALTER TABLE public."Character" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all characters
CREATE POLICY "Allow authenticated users to read characters"
ON public."Character"
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read their own characters through UserCollection
CREATE POLICY "Allow users to read their collected characters"
ON public."Character"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."UserCollection"
    WHERE "UserCollection"."characterId" = "Character".id
    AND "UserCollection"."userId"::uuid = auth.uid()
  )
); 