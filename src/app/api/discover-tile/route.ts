import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculateGoldReward, GridTile, TileType } from '@/types/game'

async function generateEventContent(character: any) {
  // TODO: Replace with actual Grok API call
  const prompt = `You are ${character.name} from ${character.Series?.name}. Generate 3 unique, in-character reactions to finding 10 gold pieces. Each reaction should be a single sentence that reflects your personality and background. Respond in JSON format with keys E1, E2, and E3.`

  // Temporary mock response until Grok API is integrated
  return {
    E1: `${character.name}: "What a fortunate discovery!"`,
    E2: `${character.name}: "This gold will serve me well."`,
    E3: `${character.name}: "A modest treasure, but welcome nonetheless."`
  }
}

export async function POST(req: Request) {
  try {
    const { userId, tileId, currentTilemap } = await req.json()

    if (!userId || !tileId || !currentTilemap) {
      return NextResponse.json({ error: 'User ID, tile ID, and current tilemap are required' }, { status: 400 })
    }

    // Get current tile info
    const tile = currentTilemap.find((t: GridTile) => t.id === tileId)
    if (!tile) {
      return NextResponse.json({ error: 'Invalid tile ID' }, { status: 400 })
    }

    // Get player stats
    const { data: playerStats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('gold, cards_collected')
      .eq('userid', userId)
      .single()

    if (statsError) throw statsError

    let reward = null
    let character = null
    let eventContent = null

    // Handle different tile types
    switch (tile.type as TileType) {
      case 'G1':
      case 'G2':
      case 'G3':
        reward = calculateGoldReward(tile.type)
        // Update player gold
        const { error: goldError } = await supabaseAdmin
          .from('playerstats')
          .update({ gold: playerStats.gold + reward })
          .eq('userid', userId)
        
        if (goldError) throw goldError
        break

      case 'P1':
      case 'P2':
      case 'P3':
      case 'P4':
        if (tile.characterId) {
          // Get character details
          const { data: char, error: charError } = await supabaseAdmin
            .from('Roster')
            .select('*, Series(*)')
            .eq('characterid', tile.characterId)
            .single()

          if (charError) throw charError

          // Add to user's collection
          const { error: collectionError } = await supabaseAdmin
            .from('UserCollection')
            .insert({
              userid: userId,
              characterid: tile.characterId,
              favorite: false
            })

          if (collectionError) throw collectionError

          // Mark character as claimed
          await supabaseAdmin
            .from('Roster')
            .update({ claimed: true })
            .eq('characterid', tile.characterId)

          // Update cards collected
          await supabaseAdmin
            .from('playerstats')
            .update({ cards_collected: playerStats.cards_collected + 1 })
            .eq('userid', userId)

          character = char
        }
        break

      case 'E1':
      case 'E2':
      case 'E3':
        // Get player's current character
        const { data: currentChar, error: currentCharError } = await supabaseAdmin
          .from('UserCollection')
          .select('characterid, selectedImageId')
          .eq('userid', userId)
          .eq('favorite', true)
          .single()

        if (currentCharError) throw currentCharError

        if (currentChar) {
          // Get character details
          const { data: eventChar, error: eventCharError } = await supabaseAdmin
            .from('Roster')
            .select('*, Series(*)')
            .eq('characterid', currentChar.characterid)
            .single()

          if (eventCharError) throw eventCharError

          // Generate event content
          const content = await generateEventContent(eventChar)
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