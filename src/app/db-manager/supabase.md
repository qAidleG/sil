# Database Manager - Supabase Documentation

## Table Schemas

### Character Table

| Name      | Type                    | Description |
|-----------|-------------------------|-------------|
| id        | integer                 | Primary key |
| name      | text                    | Character name |
| seriesId  | integer                 | Foreign key to Series table |
| bio       | text                    | Character biography |
| rarity    | integer                 | Character rarity level (1-5) |
| dialogs   | text[]                  | Array of character dialogues |
| createdAt | timestamp without time zone | Creation timestamp |
| updatedAt | timestamp without time zone | Last update timestamp |

### Series Table

| Name      | Type                    | Description |
|-----------|-------------------------|-------------|
| id        | integer                 | Primary key |
| name      | text                    | Series name |
| universe  | text                    | Universe/world name |
| createdAt | timestamp without time zone | Creation timestamp |
| updatedAt | timestamp without time zone | Last update timestamp |

### GeneratedImage Table

| Name         | Type                    | Description |
|--------------|-------------------------|-------------|
| id           | integer                 | Primary key |
| characterId  | integer                 | Foreign key to Character table |
| collectionId | integer                 | Foreign key to Collection table |
| seed         | integer                 | Image generation seed |
| prompt       | text                    | Generation prompt |
| style        | text                    | Image style |
| url          | text                    | Image URL |
| createdAt    | timestamp without time zone | Creation timestamp |
| updatedAt    | timestamp without time zone | Last update timestamp |

## Common Operations

### Character Operations

```typescript
// Read all characters
const { data, error } = await supabase
  .from('Character')
  .select('*')

// Read with specific columns
const { data, error } = await supabase
  .from('Character')
  .select('name, bio, rarity')

// Read with relationships
const { data, error } = await supabase
  .from('Character')
  .select(`
    *,
    Series (
      name,
      universe
    )
  `)

// With pagination
const { data, error } = await supabase
  .from('Character')
  .select('*')
  .range(0, 9)
```

### Filtering

```typescript
// Basic filters
const { data, error } = await supabase
  .from('Character')
  .select("*")
  .eq('rarity', 5)           // Equal to
  .gt('rarity', 3)          // Greater than
  .lt('rarity', 3)          // Less than
  .gte('rarity', 4)         // Greater than or equal to
  .lte('rarity', 2)         // Less than or equal to
  .like('name', '%Sery%')   // Case sensitive search
  .ilike('name', '%sery%')  // Case insensitive search
  .is('seriesId', null)     // Is null check
  .in('rarity', [4, 5])     // In array
  .neq('rarity', 1)         // Not equal to

// Array operations
const { data, error } = await supabase
  .from('Character')
  .select('*')
  .contains('dialogs', ['specific dialog'])
```

### Insert Operations

```typescript
// Insert single character
const { data, error } = await supabase
  .from('Character')
  .insert([{
    name: 'New Character',
    bio: 'Character description',
    rarity: 4,
    dialogs: ['Hello!', 'Goodbye!'],
    seriesId: 1
  }])
  .select()

// Bulk insert
const { data, error } = await supabase
  .from('Character')
  .insert([
    { name: 'Character 1', rarity: 3 },
    { name: 'Character 2', rarity: 4 }
  ])
  .select()
```

### Update Operations

```typescript
// Update character
const { data, error } = await supabase
  .from('Character')
  .update({ 
    bio: 'Updated biography',
    rarity: 5
  })
  .eq('id', 1)
  .select()
```

### Delete Operations

```typescript
// Delete character
const { error } = await supabase
  .from('Character')
  .delete()
  .eq('id', 1)
```

### Real-time Subscriptions

```typescript
// Subscribe to all character changes
const channel = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Character' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Subscribe to specific events
const channel = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Character' },
    (payload) => {
      console.log('New character added:', payload)
    }
  )
  .subscribe()

// Subscribe to specific character updates
const channel = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'Character',
      filter: 'id=eq.1'
    },
    (payload) => {
      console.log('Character updated:', payload)
    }
  )
  .subscribe()
```

### Series Operations

```typescript
// Read all series
const { data, error } = await supabase
  .from('Series')
  .select('*')

// Read with relationships
const { data, error } = await supabase
  .from('Series')
  .select(`
    *,
    Character (
      id,
      name,
      rarity
    )
  `)

// Create new series
const { data, error } = await supabase
  .from('Series')
  .insert([{
    name: 'New Series',
    universe: 'Fantasy World'
  }])
  .select()

// Bulk insert series
const { data, error } = await supabase
  .from('Series')
  .insert([
    { name: 'Series 1', universe: 'Sci-Fi Universe' },
    { name: 'Series 2', universe: 'Medieval Realm' }
  ])
  .select()

// Update series
const { data, error } = await supabase
  .from('Series')
  .update({ 
    universe: 'Updated Universe'
  })
  .eq('id', 1)
  .select()

// Delete series
const { error } = await supabase
  .from('Series')
  .delete()
  .eq('id', 1)

// Get series by universe
const { data, error } = await supabase
  .from('Series')
  .select('*, Character(*)')
  .eq('universe', 'Fantasy World')

// Search series by name
const { data, error } = await supabase
  .from('Series')
  .select('*')
  .ilike('name', '%search term%')

// Real-time subscription to series changes
const channel = supabase.channel('custom-series-channel')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'Series'
    },
    (payload) => {
      console.log('Series changed:', payload)
    }
  )
  .subscribe()
```

### GeneratedImage Operations

```typescript
// Read all generated images
const { data, error } = await supabase
  .from('GeneratedImage')
  .select('*')

// Read with relationships
const { data, error } = await supabase
  .from('GeneratedImage')
  .select(`
    *,
    Character (
      name,
      rarity
    )
  `)

// Create new image
const { data, error } = await supabase
  .from('GeneratedImage')
  .insert([{
    characterId: 1,
    seed: 12345,
    prompt: 'Character portrait',
    style: 'anime',
    url: 'https://example.com/image.png'
  }])
  .select()

// Update image
const { data, error } = await supabase
  .from('GeneratedImage')
  .update({ 
    prompt: 'Updated prompt',
    style: 'realistic'
  })
  .eq('id', 1)
  .select()

// Delete image
const { error } = await supabase
  .from('GeneratedImage')
  .delete()
  .eq('id', 1)

// Get images by character
const { data, error } = await supabase
  .from('GeneratedImage')
  .select('*')
  .eq('characterId', 1)

// Real-time subscription to image changes
const channel = supabase.channel('custom-image-channel')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'GeneratedImage'
    },
    (payload) => {
      console.log('Image changed:', payload)
    }
  )
  .subscribe()
```
