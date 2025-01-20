-- Enable RLS on UserCollection table
ALTER TABLE public."UserCollection" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own collections
CREATE POLICY "Users can read their own collections"
ON public."UserCollection"
FOR SELECT
TO authenticated
USING (auth.uid() = "userId"::uuid);

-- Allow users to insert into their own collections
CREATE POLICY "Users can insert into their own collections"
ON public."UserCollection"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId"::uuid);

-- Allow users to delete from their own collections
CREATE POLICY "Users can delete from their own collections"
ON public."UserCollection"
FOR DELETE
TO authenticated
USING (auth.uid() = "userId"::uuid); 