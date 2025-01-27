import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GridTile, TileType, GameState, INITIAL_GRID_LAYOUT, calculateGoldReward } from '@/types/game'
import { sendGrokMessage } from '@/lib/api'

// Generate event content for a specific character encounter
async function generateCharacterEvent(playerCharacter: any, encounterCharacter: any) {
  const prompt = `You are ${playerCharacter.name} from ${playerCharacter.Series?.name || 'an unknown series'}. 
Generate a short, in-character dialog that would occur when you encounter ${encounterCharacter.name} from ${encounterCharacter.Series?.name || 'an unknown series'}.
The dialog should reflect both characters' personalities and backgrounds, and hint at a potential future alliance.
Keep it to 1-2 sentences, focusing on the excitement of meeting a new ally.`

  try {
    const response = await sendGrokMessage(prompt, [], process.env.GROK_API_KEY, playerCharacter.bio)
    return response.content.trim()
  } catch (error) {
    console.error('Error generating character event:', error)
    return `${playerCharacter.name} encounters ${encounterCharacter.name}!`
  }
}

// Generate event tile content using C4 character
async function generateEventContent(playerCharacter: any, c4Character: any) {
  const prompt = `You are ${c4Character.name} from ${c4Character.Series?.name || 'an unknown series'}, 
secretly watching ${playerCharacter.name}'s progress through the game board.

Generate 3 unique events where you indirectly help them, building anticipation for your eventual reveal:
E1: A mysterious teaching moment where you share wisdom from the shadows (reward: 10 gold)
E2: An exciting discovery you help them make while staying hidden (reward: 10 gold)
E3: A challenge you help them overcome anonymously (reward: 10 gold)

Each event should hint at your presence without revealing your identity.
Respond in JSON format with keys E1, E2, and E3. Each response should be 1-2 sentences.`

  try {
    const response = await sendGrokMessage(prompt, [], process.env.GROK_API_KEY, c4Character.bio)
    const content = response.content.trim()
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}') + 1
    const jsonStr = content.slice(jsonStart, jsonEnd)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Error generating event content:', error)
    return {
      E1: `A mysterious voice shares some wisdom, rewarding you with 10 gold.`,
      E2: `An unseen helper guides you to a discovery, leaving 10 gold as a gift.`,
      E3: `A hidden ally assists in overcoming a challenge, providing 10 gold for your efforts.`
    }
  }
}

// Calculate total possible gold from a board
function calculateBoardGold(tilemap: GridTile[]): number {
  return tilemap.reduce((total, tile) => total + calculateGoldReward(tile), 0)
}

async function generateCharacterImage(character: any) {
  try {
    // Generate image using Flux API with a mystical background prompt
    const basePrompt = `Create an epic anime style art of ${character.name}, a ${character.bio?.split('.')[0]}. Character shown in a majestic pose against a cosmic background with nebulas and stars. Expression is mysterious and powerful. Ethereal lighting effects and magical aura surrounding the character. High-quality anime art style, clean lines, cosmic color palette.`
    
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
    return data.image_url
  } catch (error) {
    console.error('Error generating character image:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get player stats
    const { data: player, error: playerError } = await supabaseAdmin
      .from('playerstats')
      .select('cards')
      .eq('userid', userId)
      .single()

    if (playerError) {
      return NextResponse.json({ error: 'Failed to get player stats' }, { status: 500 })
    }

    // Check for existing unfinished game
    const { data: existingGame } = await supabaseAdmin
      .from('gridprogress')
      .select('tilemap')
      .eq('user_id', userId)
      .single()

    // If there's an existing unfinished game, return it without using a card
    if (existingGame && !existingGame.tilemap.every((tile: GridTile) => tile.discovered)) {
      return NextResponse.json({
        success: true,
        gameState: {
          tilemap: existingGame.tilemap,
          goldCollected: 0,
          playerPosition: existingGame.tilemap.findIndex((tile: GridTile) => tile.type === 'P')
        }
      })
    }

    // Check if player has cards available
    if (player.cards <= 0) {
      return NextResponse.json({ 
        error: `No play cards available! Buy more cards with gold.`,
        requiredCards: 1
      }, { status: 400 })
    }

    // Get unclaimed characters for C1-C3 tiles
    const { data: characters, error: charactersError } = await supabaseAdmin
      .from('Roster')
      .select('characterid')
      .eq('claimed', false)
      .limit(3)

    if (charactersError) throw charactersError

    // Generate new board
    const newGrid = INITIAL_GRID_LAYOUT.map((tile: GridTile) => {
      if (tile.type.startsWith('C') && !tile.type.includes('4')) {  // Check for C1-C3 only
        const index = parseInt(tile.type.charAt(1)) - 1
        return {
          ...tile,
          characterId: characters[index]?.characterid
        }
      }
      return tile
    })

    // Deduct one card and create new game
    const { error: updateError } = await supabaseAdmin
      .from('playerstats')
      .update({ cards: player.cards - 1 })
      .eq('userid', userId)

    if (updateError) throw updateError

    // Create new grid progress
    const { error: createError } = await supabaseAdmin
      .from('gridprogress')
      .upsert({
        user_id: userId,
        tilemap: newGrid,
        goldCollected: 0
      })

    if (createError) throw createError

    return NextResponse.json({
      success: true,
      gameState: {
        tilemap: newGrid,
        goldCollected: 0,
        playerPosition: 12  // Center position
      },
      cardsRemaining: player.cards - 1
    })

  } catch (error) {
    console.error('Error creating new game:', error)
    return NextResponse.json({ error: 'Failed to create new game' }, { status: 500 })
  }
} 