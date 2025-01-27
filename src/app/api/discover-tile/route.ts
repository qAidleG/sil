import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculateGoldReward, GridTile, TileType } from '@/types/game'
import { Character } from '@/types/database'

async function generateEventContent(character: Character) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/event-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.characterid })
    });

    if (!response.ok) throw new Error('Failed to generate event content');
    return await response.json();
  } catch (error) {
    console.error('Error generating event content:', error);
    // Fallback to basic messages if API fails
    return {
      E1: `${character.name} shares their wisdom with you.`,
      E2: `${character.name} helps you discover a treasure.`,
      E3: `${character.name} assists you in a task.`
    };
  }
}

async function generateCharacterEncounter(discoveredCharacter: Character, playerCharacter: Character) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-dialog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outgoingCharacter: {
          name: playerCharacter.name,
          series: playerCharacter.Series?.name
        },
        incomingCharacter: {
          name: discoveredCharacter.name,
          series: discoveredCharacter.Series?.name
        }
      })
    });

    if (!response.ok) throw new Error('Failed to generate dialog');
    const dialog = await response.json();
    return dialog.incoming; // Use the incoming character's dialog
  } catch (error) {
    console.error('Error generating character encounter:', error);
    return `${discoveredCharacter.name} joins your collection!`;
  }
}

async function generateCharacterImage(character: Character) {
  try {
    // Generate image using Flux API
    const basePrompt = `Create an anime style trading card art of ${character.name}, a ${character.bio?.split('.')[0]}. Character shown in a noble portrait pose, facing slightly to the side, elegant and composed. Expression is confident and cheerful. Premium trading card game background with subtle magical effects and professional card frame. High-quality anime art style, clean lines, vibrant colors.`
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/flux`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: basePrompt,
        seed: Math.floor(Math.random() * 1000000)
      })
    })

    if (!response.ok) throw new Error('Failed to generate image')
    const data = await response.json()
    
    // Store image in character's first available slot
    const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/store-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: character.characterid,
        url: data.image_url,
        prompt: basePrompt,
        style: 'anime',
        seed: Math.floor(Math.random() * 1000000)
      })
    })

    if (!storeResponse.ok) throw new Error('Failed to store image')
    return data.image_url
  } catch (error) {
    console.error('Error generating character image:', error)
    return null
  }
}

// Add interface for game state from database
interface GameProgress {
  tilemap: GridTile[]
  unlockedCharacters: number[]
  gold: number
  completionReward?: { characterId: number; eventContent: any }
}

export async function POST(req: Request) {
  try {
    const { userId, tileId, characterId } = await req.json()
    if (!userId || !tileId || !characterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current game state
    const { data: gameState, error: gameError } = await supabaseAdmin
      .from('gridprogress')
      .select('tilemap, unlockedCharacters, gold, completionReward')
      .eq('userid', userId)
      .single()
      .then(result => ({
        data: result.data as GameProgress,
        error: result.error
      }))

    if (gameError) throw gameError
    if (!gameState?.tilemap) {
      return NextResponse.json({ error: 'No game in progress' }, { status: 400 })
    }

    const currentTilemap = gameState.tilemap as GridTile[]
    const tile = currentTilemap.find((t: GridTile) => t.id === tileId)
    const unlockedCharacters = gameState.unlockedCharacters || []

    if (!tile) {
      return NextResponse.json({ error: 'Tile not found' }, { status: 404 })
    }

    // Get player's character for dialog generation
    const { data: playerCharacter } = await supabaseAdmin
      .from('Roster')
      .select('*')
      .eq('characterid', characterId)
      .single()

    if (!playerCharacter) {
      return NextResponse.json({ error: 'Player character not found' }, { status: 404 })
    }

    let reward = calculateGoldReward(tile)
    let character = null
    let eventContent = null
    let unlockedCharacter = null
    let boardCompletionCharacter = null
    let generatedImageUrl = null

    // Process tile based on type
    if (tile.type.startsWith('C')) {
      // Get the character assigned to this tile
      const { data: tileCharacter } = await supabaseAdmin
        .from('Roster')
        .select('*')
        .eq('characterid', tile.characterId)
        .single()

      if (tileCharacter) {
        // Generate character image
        generatedImageUrl = await generateCharacterImage(tileCharacter)

        // Add to user's collection with generated image
        await supabaseAdmin
          .from('UserCollection')
          .insert({
            userid: userId,
            characterid: tileCharacter.characterid,
            favorite: false,
            selectedImageId: generatedImageUrl ? 1 : null // Set first image as selected if generated
          })

        // Mark character as claimed
        await supabaseAdmin
          .from('Roster')
          .update({ claimed: true })
          .eq('characterid', tileCharacter.characterid)

        unlockedCharacter = tileCharacter
        eventContent = tile.eventContent // Use pre-generated content
        unlockedCharacters.push(tileCharacter.characterid)
      }
    } else if (tile.type.startsWith('E')) {
      eventContent = tile.eventContent // Use pre-generated content
    }

    // Mark tile as discovered
    const updatedTilemap = currentTilemap.map((t: GridTile) => 
      t.id === tileId ? { ...t, discovered: true } : t
    )

    // Check if board is completed
    const gridCleared = updatedTilemap.every(t => t.discovered)
    
    // If board is completed, unlock C4 character from completion reward
    if (gridCleared && gameState.completionReward) {
      // Add C4 character to user's collection
      await supabaseAdmin
        .from('UserCollection')
        .insert({
          userid: userId,
          characterid: gameState.completionReward.characterId,
          favorite: false
        })

      // Mark C4 character as claimed
      await supabaseAdmin
        .from('Roster')
        .update({ claimed: true })
        .eq('characterid', gameState.completionReward.characterId)

      // Get C4 character data
      const { data: c4Character } = await supabaseAdmin
        .from('Roster')
        .select('*')
        .eq('characterid', gameState.completionReward.characterId)
        .single()

      if (c4Character) {
        boardCompletionCharacter = c4Character
        eventContent = gameState.completionReward.eventContent // Use pre-generated completion dialog
        unlockedCharacters.push(c4Character.characterid)
      }
    }

    // Update game state
    await supabaseAdmin
      .from('gridprogress')
      .update({ 
        tilemap: updatedTilemap,
        unlockedCharacters,
        gridCleared
      })
      .eq('userid', userId)

    // Update player stats
    await supabaseAdmin
      .from('playerstats')
      .update({ 
        gold: gameState.gold + reward
      })
      .eq('userid', userId)

    return NextResponse.json({
      success: true,
      reward,
      character,
      eventContent,
      updatedTilemap,
      gridCleared,
      unlockedCharacter,
      boardCompletionCharacter,
      generatedImageUrl
    })

  } catch (error) {
    console.error('Error processing tile:', error)
    return NextResponse.json(
      { error: 'Failed to process tile' },
      { status: 500 }
    )
  }
} 