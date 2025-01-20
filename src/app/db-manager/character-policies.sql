-- Enable RLS
ALTER TABLE public."Character" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read characters
CREATE POLICY "Allow authenticated users to read characters"
ON public."Character"
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create characters
CREATE POLICY "Allow authenticated users to create characters"
ON public."Character"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own characters
CREATE POLICY "Allow authenticated users to update characters"
ON public."Character"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

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