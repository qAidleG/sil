-- First drop the tables (in correct order due to dependencies)
DROP TABLE IF EXISTS "public"."gridprogress";
DROP TABLE IF EXISTS "public"."playerstats";

-- Now recreate the PlayerStats table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GridProgress table
CREATE TABLE IF NOT EXISTS "public"."gridprogress" (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    discoveredTiles JSONB NOT NULL DEFAULT '[]',
    goldCollected INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."playerstats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."gridprogress" ENABLE ROW LEVEL SECURITY;

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

-- Create updated_at trigger for gridprogress
CREATE TRIGGER update_gridprogress_updated_at
    BEFORE UPDATE ON "public"."gridprogress"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 