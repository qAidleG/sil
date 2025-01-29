-- Create the series table first (since Roster references it)
CREATE TABLE IF NOT EXISTS public.series (
    seriesid SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    universe TEXT NOT NULL,
    seriesability TEXT
);

-- Create the Roster table
CREATE TABLE IF NOT EXISTS public.Roster (
    characterid SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    seriesid INTEGER REFERENCES public.series(seriesid),
    dialogs TEXT[],
    image1url TEXT,
    image2url TEXT,
    image3url TEXT,
    image4url TEXT,
    claimed BOOLEAN DEFAULT false
);

-- Create the user collection table
CREATE TABLE IF NOT EXISTS public.UserCollection (
    id SERIAL PRIMARY KEY,
    userid UUID NOT NULL,
    characterid INTEGER REFERENCES public.Roster(characterid),
    customName TEXT,
    favorite BOOLEAN DEFAULT false,
    selectedImageId INTEGER
);

-- Create the player stats table
CREATE TABLE IF NOT EXISTS public.playerstats (
    userid UUID PRIMARY KEY,
    gold INTEGER DEFAULT 500,
    email TEXT,
    cards INTEGER DEFAULT 2,
    moves INTEGER DEFAULT 30,
    cards_collected INTEGER DEFAULT 0
);

-- Create the grid progress table
CREATE TABLE IF NOT EXISTS public.gridprogress (
    id SERIAL PRIMARY KEY,
    userid UUID NOT NULL,
    tilemap JSONB,
    clearreward JSONB
);

-- Enable Row Level Security
ALTER TABLE public.Roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.UserCollection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playerstats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gridprogress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Roster
CREATE POLICY "Allow authenticated users to read roster"
ON public.Roster
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for Series
CREATE POLICY "Allow authenticated users to read series"
ON public.series
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for UserCollection
CREATE POLICY "Allow users to read their own collection"
ON public.UserCollection
FOR SELECT
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Allow users to insert into their own collection"
ON public.UserCollection
FOR INSERT
TO authenticated
WITH CHECK (userid = auth.uid());

CREATE POLICY "Allow users to update their own collection"
ON public.UserCollection
FOR UPDATE
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

-- RLS Policies for playerstats
CREATE POLICY "Allow users to read their own stats"
ON public.playerstats
FOR SELECT
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Allow users to update their own stats"
ON public.playerstats
FOR UPDATE
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

-- RLS Policies for gridprogress
CREATE POLICY "Allow users to manage their own grid progress"
ON public.gridprogress
FOR ALL
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid()); 