-- Create the series table first (since characters reference it)
CREATE TABLE IF NOT EXISTS public.series (
    seriesid SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    universe TEXT NOT NULL,
    seriesability TEXT
);

-- Create the characters table
CREATE TABLE IF NOT EXISTS public.characters (
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
    image5url TEXT,
    image6url TEXT,
    claimed BOOLEAN DEFAULT false
);

-- Create the user collection table
CREATE TABLE IF NOT EXISTS public.usercollection (
    id SERIAL PRIMARY KEY,
    userid TEXT NOT NULL,
    characterid INTEGER REFERENCES public.characters(characterid),
    customName TEXT,
    favorite BOOLEAN DEFAULT false,
    selectedImageId INTEGER
);

-- Create the player stats table
CREATE TABLE IF NOT EXISTS public.player_stats (
    userid TEXT PRIMARY KEY,
    gold INTEGER DEFAULT 500,
    moves INTEGER DEFAULT 30,
    cards INTEGER DEFAULT 2,
    last_move_refresh TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE public."UserCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playerstats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Roster" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gridprogress ENABLE ROW LEVEL SECURITY;

-- User Collection policies
CREATE POLICY "Users can read their own collection"
ON public."UserCollection"
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

-- Player Stats policies
CREATE POLICY "Users can read their own stats"
ON public.playerstats
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

-- Roster policies
CREATE POLICY "Anyone can read characters"
ON public."Roster"
FOR SELECT
TO authenticated
USING (true);

-- Series policies
CREATE POLICY "Anyone can read series"
ON public."Series"
FOR SELECT
TO authenticated
USING (true);

-- Grid Progress policies
CREATE POLICY "Users can read their own grid progress"
ON public.gridprogress
FOR SELECT
TO authenticated
USING (auth.uid() = userid);

-- Also add insert/update policies for user data
CREATE POLICY "Users can insert their own collection"
ON public."UserCollection"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own collection"
ON public."UserCollection"
FOR UPDATE
TO authenticated
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can insert their own stats"
ON public.playerstats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own stats"
ON public.playerstats
FOR UPDATE
TO authenticated
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can insert their own grid progress"
ON public.gridprogress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own grid progress"
ON public.gridprogress
FOR UPDATE
TO authenticated
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid); 
