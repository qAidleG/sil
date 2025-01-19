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
CREATE TABLE IF NOT EXISTS "public"."PlayerStats" (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    cards_collected INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE "public"."Deck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Battle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlayerStats" ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view any player stats"
    ON "public"."PlayerStats"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can only update their own stats"
    ON "public"."PlayerStats"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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
    BEFORE UPDATE ON "public"."PlayerStats"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 