import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_MOVES = 30
const MOVES_PER_MINUTE = 10

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current player stats
    const { data: player, error: playerError } = await supabaseAdmin
      .from('playerstats')
      .select('moves, last_move_refresh')
      .eq('userid', userId)
      .single()

    if (playerError) {
      return NextResponse.json({ error: 'Failed to get player stats' }, { status: 500 })
    }

    const now = new Date()
    const lastRefresh = new Date(player.last_move_refresh)
    
    // Calculate minutes since last refresh, even if offline
    const minutesSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60))
    const movesToAdd = minutesSinceRefresh * MOVES_PER_MINUTE
    
    // Cap at MAX_MOVES
    const newMoves = Math.min(MAX_MOVES, player.moves + movesToAdd)

    // Only update if moves changed
    if (newMoves !== player.moves) {
      const { error: updateError } = await supabaseAdmin
        .from('playerstats')
        .update({
          moves: newMoves,
          last_move_refresh: now.toISOString()
        })
        .eq('userid', userId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update moves' }, { status: 500 })
      }
    }

    return NextResponse.json({
      moves: newMoves,
      lastRefresh: now.toISOString()
    })

  } catch (error) {
    console.error('Error refreshing moves:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 