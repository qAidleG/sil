import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const { data: stats, error } = await supabaseAdmin
      .from('playerstats')
      .select('gold, moves, last_move_refresh')
      .eq('userid', userId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      gold: stats.gold,
      moves: stats.moves,
      lastRefresh: stats.last_move_refresh
    })

  } catch (error) {
    console.error('Error getting player stats:', error)
    return NextResponse.json({ error: 'Failed to get player stats' }, { status: 500 })
  }
} 