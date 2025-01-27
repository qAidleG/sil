import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { INITIAL_GRID_LAYOUT, GameState, GridTile } from '@/types/game'

// Check if board is completed
function isBoardCompleted(tilemap: GridTile[]) {
  return tilemap.every(tile => tile.discovered)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Get player stats and grid progress
    const [statsResult, gridResult] = await Promise.all([
      supabaseAdmin
        .from('playerstats')
        .select('*')
        .eq('userid', userId)
        .single(),
      supabaseAdmin
        .from('gridprogress')
        .select('tilemap, goldCollected')
        .eq('user_id', userId)
        .single()
    ])

    if (statsResult.error) throw statsResult.error

    // If no grid exists or the existing grid is completed, initialize a new one
    if (gridResult.error || (gridResult.data && isBoardCompleted(gridResult.data.tilemap))) {
      // Get unclaimed characters for P1-P4 tiles
      const { data: characters, error: charactersError } = await supabaseAdmin
        .from('Roster')
        .select('characterid')
        .eq('claimed', false)
        .limit(4)

      if (charactersError) throw charactersError

      // Assign characters to P1-P4 tiles
      const initialGrid = INITIAL_GRID_LAYOUT.map((tile: GridTile) => {
        if (tile.type.startsWith('P') && tile.type !== 'P') {
          const index = parseInt(tile.type.charAt(1)) - 1
          return {
            ...tile,
            characterId: characters[index]?.characterid
          }
        }
        return tile
      })

      // Create new grid progress
      const { error: createError } = await supabaseAdmin
        .from('gridprogress')
        .upsert({
          user_id: userId,
          tilemap: initialGrid,
          goldCollected: 0
        })

      if (createError) throw createError

      return NextResponse.json({
        stats: statsResult.data,
        gameState: {
          tilemap: initialGrid,
          goldCollected: 0,
          playerPosition: 13  // Starting position
        }
      })
    }

    return NextResponse.json({
      stats: statsResult.data,
      gameState: {
        tilemap: gridResult.data.tilemap,
        goldCollected: gridResult.data.goldCollected,
        playerPosition: gridResult.data.tilemap.findIndex((tile: GridTile) => tile.type === 'P')
      }
    })

  } catch (error) {
    console.error('Error getting game state:', error)
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId, gameState }: { userId: string, gameState: GameState } = await req.json()

    if (!userId || !gameState) {
      return NextResponse.json({ error: 'User ID and game state are required' }, { status: 400 })
    }

    // If board is completed, clear the grid
    if (isBoardCompleted(gameState.tilemap)) {
      await supabaseAdmin
        .from('gridprogress')
        .delete()
        .eq('user_id', userId)

      return NextResponse.json({ success: true, completed: true })
    }

    // Update grid progress
    const { error: gridError } = await supabaseAdmin
      .from('gridprogress')
      .upsert({
        user_id: userId,
        tilemap: gameState.tilemap,
        goldCollected: gameState.goldCollected
      })

    if (gridError) {
      throw gridError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving game state:', error)
    return NextResponse.json({ error: 'Failed to save game state' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Delete grid progress
    await supabaseAdmin
      .from('gridprogress')
      .delete()
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error resetting game:', error)
    return NextResponse.json({ error: 'Failed to reset game' }, { status: 500 })
  }
} 