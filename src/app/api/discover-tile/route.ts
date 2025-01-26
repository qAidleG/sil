import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculateGoldReward, GridTile, TileType } from '@/types/game'
import { Character, isDatabaseCharacter } from '@/types/database'

async function generateEventContent(character: Character) {
  // TODO: Replace with actual Grok API call
  const events = {
    E1: [
      `${character.name} shares their wisdom with you, granting +10 gold.`,
      `${character.name} teaches you a valuable lesson about perseverance.`,
      `${character.name} shows you a secret technique for gathering resources.`
    ],
    E2: [
      `${character.name} helps you discover a hidden treasure, earning +10 gold.`,
      `${character.name} leads you to a valuable resource cache.`,
      `${character.name} reveals a shortcut that saves you time and resources.`
    ],
    E3: [
      `${character.name} assists you in a challenging task, rewarding you with +10 gold.`,
      `${character.name} shares their expertise, helping you earn a reward.`,
      `${character.name} guides you to complete a difficult challenge successfully.`
    ]
  }

  return {
    E1: events.E1[Math.floor(Math.random() * events.E1.length)],
    E2: events.E2[Math.floor(Math.random() * events.E2.length)],
    E3: events.E3[Math.floor(Math.random() * events.E3.length)]
  }
}

export async function POST(req: Request) {
  try {
    const { userId, tileId } = await req.json()
    if (!userId || !tileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current game state
    const { data: gameState, error: gameError } = await supabaseAdmin
      .from('gridprogress')
      .select('tilemap')
      .eq('userid', userId)
      .single()

    if (gameError) throw gameError
    if (!gameState?.tilemap) {
      return NextResponse.json({ error: 'No game in progress' }, { status: 400 })
    }

    const currentTilemap = gameState.tilemap
    const tile = currentTilemap.find((t: GridTile) => t.id === tileId)

    if (!tile) {
      return NextResponse.json({ error: 'Tile not found' }, { status: 404 })
    }

    if (tile.type === 'C') {
      return NextResponse.json({ error: 'Tile already claimed' }, { status: 400 })
    }

    // Get player stats for gold updates
    const { data: playerStats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('*')
      .eq('userid', userId)
      .single()

    if (statsError) throw statsError

    let reward = 0
    let character = null
    let eventContent = null

    // Process tile based on type
    switch (tile.type) {
      case 'G':
        reward = calculateGoldReward(tile)
        // Update player gold
        const { error: goldError } = await supabaseAdmin
          .from('playerstats')
          .update({ gold: playerStats.gold + reward })
          .eq('userid', userId)

        if (goldError) throw goldError
        break

      case 'C1':
      case 'C2':
      case 'C3':
      case 'C4':
      case 'C5':
        // Get a random unclaimed character
        const { data: userCollection, error: collectionError } = await supabaseAdmin
          .from('UserCollection')
          .select(`
            Roster (
              *,
              Series (
                name,
                universe,
                seriesability
              )
            )
          `)
          .eq('userid', userId)

        if (collectionError) throw collectionError

        // Convert the Supabase response to our Character type
        const rosterData = userCollection[0]?.Roster
        const char = rosterData as unknown as Character

        if (isDatabaseCharacter(char)) {
          // Generate event content
          const content = await generateEventContent(char)
          eventContent = content[tile.type as 'E1' | 'E2' | 'E3']  // Type-safe access
          reward = 10  // Fixed 10 gold for event tiles

          // Update player gold
          const { error: eventGoldError } = await supabaseAdmin
            .from('playerstats')
            .update({ gold: playerStats.gold + reward })
            .eq('userid', userId)

          if (eventGoldError) throw eventGoldError
        }
        break
    }

    // Mark tile as claimed in the tilemap
    const updatedTilemap = currentTilemap.map((t: GridTile) => 
      t.id === tileId ? { ...t, type: 'C' as TileType } : t
    )

    return NextResponse.json({
      success: true,
      reward,
      character,
      eventContent,
      updatedTilemap
    })

  } catch (error) {
    console.error('Error discovering tile:', error)
    return NextResponse.json({ error: 'Failed to discover tile' }, { status: 500 })
  }
} 