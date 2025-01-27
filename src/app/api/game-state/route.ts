import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { INITIAL_GRID_LAYOUT, GameState, GridTile } from '@/types/game'

// Check if board is completed
function isBoardCompleted(tilemap: GridTile[]) {
  return tilemap.every(tile => tile.discovered)  // Board is completed when all tiles are discovered
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Get current game state from database
    const { data: gameState, error } = await supabaseAdmin
      .from('GameState')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch game state' }, { status: 500 })
    }

    // Check if board is completed and update state if needed
    if (gameState && !gameState.gridCleared && isBoardCompleted(gameState.tilemap)) {
      const { error: updateError } = await supabaseAdmin
        .from('GameState')
        .update({ gridCleared: true })
        .eq('userId', userId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 })
      }

      gameState.gridCleared = true
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Error in game state route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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