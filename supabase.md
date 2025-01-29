# Supabase Database Structure

## Tables

### Roster
Primary table for character data
```sql
characterid: int4 (Primary Key)
name: text
bio: text
rarity: int4
seriesid: int4 (Foreign Key -> Series.seriesid)
dialogs: _text (Array)
image1url: text (nullable)
image2url: text (nullable)
image3url: text (nullable)
image4url: text (nullable)
image5url: text (nullable)
image6url: text (nullable)
claimed: bool
```

### Series
Stores series/universe information
```sql
seriesid: int4 (Primary Key)
name: text
universe: text
seriesability: text (nullable)
```

### UserCollection
Links users to their collected characters
```sql
id: int4 (Primary Key)
userid: uuid (Foreign Key -> auth.users.id)
characterid: int4 (Foreign Key -> Roster.characterid)
customName: text (nullable)
favorite: bool
selectedImageId: int4 (nullable)
```

### playerstats
Stores player progression and resources
```sql
userid: uuid (Primary Key, Foreign Key -> auth.users.id)
turns: int4
gold: int4
email: text
cards: int4
```

### gridprogress
Stores game grid state for each user
```sql
id: int8 (Primary Key)
userid: uuid (Foreign Key -> auth.users.id)
tilemap: jsonb
clearreward: jsonb (nullable)
```

### _prisma_migrations
System table for migrations
```sql
id: varchar
checksum: varchar
finished_at: timestamptz (nullable)
migration_name: varchar
logs: text (nullable)
rolled_back_at: timestamptz (nullable)
started_at: timestamptz
applied_steps_count: int4
```

## Row Level Security (RLS) Policies

```sql
-- Roster table
"Enable read access to roster" ON "Roster" FOR SELECT

-- Series table
"Enable read access to series" ON "Series" FOR SELECT

-- UserCollection table
"Enable user access to own data" ON "UserCollection" FOR ALL

-- gridprogress table
"Enable user access to own progress" ON "gridprogress" FOR ALL

-- playerstats table
"Enable user access to own stats" ON "playerstats" FOR ALL
```

## Foreign Key Relationships

- `Roster.seriesid` -> `Series.seriesid`
- `UserCollection.userid` -> `auth.users.id`
- `UserCollection.characterid` -> `Roster.characterid`
- `playerstats.userid` -> `auth.users.id`
- `gridprogress.userid` -> `auth.users.id`

## Key Features

1. **Authentication Integration**
   - All user-specific tables are linked to `auth.users.id`
   - RLS policies ensure users can only access their own data
   - Public read-only access to Roster and Series tables

2. **Character System**
   - Characters belong to Series
   - Multiple image URLs per character (up to 6)
   - Dialog system support through text arrays
   - Rarity system for characters

3. **Game Progress**
   - Grid-based game progress stored in JSONB
   - Separate stats tracking for player resources
   - Collection system with favorites and custom names

4. **Data Types**
   - UUIDs for user IDs
   - JSONB for flexible data storage (tilemap, clearreward)
   - Text arrays for character dialogs
   - Nullable fields for optional content

## Notes

- All tables use appropriate foreign key constraints
- JSONB fields allow for flexible game state storage
- RLS policies implement a secure multi-tenant system
- Nullable fields support gradual content population 
