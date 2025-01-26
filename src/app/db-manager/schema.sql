-- Enable Row Level Security
ALTER TABLE "public"."Character" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."GeneratedImage" ENABLE ROW LEVEL SECURITY;

-- Create Deck table
CREATE TABLE IF NOT EXISTS "public"."Deck" (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cards JSONB[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Battle table
CREATE TABLE IF NOT EXISTS "public"."Battle" (
    id BIGSERIAL PRIMARY KEY,
    player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    turns JSONB[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create PlayerStats table
CREATE TABLE IF NOT EXISTS "public"."playerstats" (
    user_id TEXT PRIMARY KEY,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    cards_collected INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    moves INTEGER NOT NULL DEFAULT 30,
    gold INTEGER NOT NULL DEFAULT 0,
    last_move_refresh TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT NOT NULL
);

-- Create GridProgress table if not exists
CREATE TABLE IF NOT EXISTS "public"."gridprogress" (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    discoveredTiles JSONB NOT NULL DEFAULT '[]',
    goldCollected INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE "public"."Deck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Battle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."playerstats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."gridprogress" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Deck policies
CREATE POLICY "Users can view their own decks"
    ON "public"."Deck"
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
    ON "public"."Deck"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
    ON "public"."Deck"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
    ON "public"."Deck"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Battle policies
CREATE POLICY "Users can view battles they participated in"
    ON "public"."Battle"
    FOR SELECT
    TO authenticated
    USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create battles they participate in"
    ON "public"."Battle"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can update battles they participate in"
    ON "public"."Battle"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = player1_id OR auth.uid() = player2_id)
    WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- PlayerStats policies
CREATE POLICY "Allow users to read their own stats"
    ON "public"."playerstats"
    FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = 'default-user');

CREATE POLICY "Allow users to update their own stats"
    ON "public"."playerstats"
    FOR UPDATE
    USING (auth.uid()::text = user_id OR user_id = 'default-user');

CREATE POLICY "Allow users to insert their own stats"
    ON "public"."playerstats"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = 'default-user');

-- GridProgress policies
CREATE POLICY "Allow users to read their own progress"
    ON "public"."gridprogress"
    FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = 'default-user');

CREATE POLICY "Allow users to update their own progress"
    ON "public"."gridprogress"
    FOR UPDATE
    USING (auth.uid()::text = user_id OR user_id = 'default-user');

CREATE POLICY "Allow users to insert their own progress"
    ON "public"."gridprogress"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = 'default-user');

CREATE POLICY "Allow users to delete their own progress"
    ON "public"."gridprogress"
    FOR DELETE
    USING (auth.uid()::text = user_id OR user_id = 'default-user');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS deck_user_id_idx ON "public"."Deck" (user_id);
CREATE INDEX IF NOT EXISTS battle_player1_id_idx ON "public"."Battle" (player1_id);
CREATE INDEX IF NOT EXISTS battle_player2_id_idx ON "public"."Battle" (player2_id);
CREATE INDEX IF NOT EXISTS battle_winner_id_idx ON "public"."Battle" (winner_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deck_updated_at
    BEFORE UPDATE ON "public"."Deck"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
    BEFORE UPDATE ON "public"."playerstats"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on Character table with correct case
ALTER TABLE public."Character" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read characters with correct case
CREATE POLICY "Allow anyone to read characters"
ON public."Character"
FOR SELECT
TO public
USING (true);

-- Add selected_image_id column to Character table
ALTER TABLE public."Character" ADD COLUMN IF NOT EXISTS selected_image_id INTEGER REFERENCES public."GeneratedImage"(id); 