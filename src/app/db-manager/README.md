# CharaSphere Database Structure

## Tables

### series
- `seriesid` (PK) - Series identifier
- `name` - Series name
- `universe` - Universe name
- `seriesability` - Special ability for the series

### Roster
- `characterid` (PK) - Character identifier
- `name` - Character name
- `bio` - Character biography
- `rarity` - Character rarity (1-6)
- `seriesid` (FK) - Reference to series
- `dialogs` - Array of character dialogues
- `image1url` to `image4url` - Character image URLs
- `claimed` - Whether character is claimed

### UserCollection
- `id` (PK) - Collection entry identifier
- `userid` - User identifier
- `characterid` (FK) - Reference to Roster
- `customName` - Custom name for character
- `favorite` - Favorite status
- `selectedImageId` - Selected image number (1-4)

### playerstats
- `userid` (PK) - User identifier
- `turns` - Available turns
- `gold` - Player's gold
- `email` - Player's email
- `cards` - Available cards
- `moves` - Available moves
- `cards_collected` - Total cards collected

### gridprogress
- `id` (PK) - Progress identifier
- `userid` - User identifier
- `tilemap` - Game board state
- `clearreward` - Board completion reward

## To View Current Policies

Run this query in Supabase SQL Editor:
```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

## Expected Policies

Each table should have minimal RLS policies:
1. Roster & Series: Allow authenticated read
2. UserCollection: Allow users to manage their own entries
3. playerstats: Allow users to manage their own stats
4. gridprogress: Allow users to manage their own progress 