import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: stats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const { data: grid, error: gridError } = await supabaseAdmin
      .from('gridprogress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (gridError && gridError.code !== 'PGRST116') {
      console.error('Error fetching grid:', gridError)
      return NextResponse.json({ error: 'Failed to fetch grid' }, { status: 500 })
    }

    return NextResponse.json({
      stats: stats || { moves: 30, gold: 0, last_move_refresh: new Date().toISOString() },
      grid: grid?.discoveredTiles || []
    })
  } catch (error) {
    console.error('Error in game-state GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, moves, gold, lastMoveRefresh, grid } = body
    console.log('POST /api/game-state body:', body)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create or update player stats
    const statsData = {
      user_id: userId,
      moves: moves ?? 30,
      gold: gold ?? 0,
      last_move_refresh: lastMoveRefresh ?? new Date().toISOString()
    }

    console.log('Upserting stats:', statsData)
    const { error: statsError } = await supabaseAdmin
      .from('playerstats')
      .upsert(statsData)

    if (statsError) {
      console.error('Error upserting stats:', statsError)
      return NextResponse.json({ error: 'Failed to save stats' }, { status: 500 })
    }

    // Update grid progress if provided
    if (grid) {
      console.log('Upserting grid progress:', { user_id: userId, grid })
      const { error: gridError } = await supabaseAdmin
        .from('gridprogress')
        .upsert({
          user_id: userId,
          discoveredTiles: grid
        })

      if (gridError) {
        console.error('Error upserting grid:', gridError)
        return NextResponse.json({ error: 'Failed to save grid' }, { status: 500 })
      }
    } else {
      console.log('No grid provided, skipping grid progress update')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in game-state POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { error: gridError } = await supabaseAdmin
      .from('gridprogress')
      .delete()
      .eq('user_id', userId)

    if (gridError) {
      console.error('Error deleting grid:', gridError)
      return NextResponse.json({ error: 'Failed to delete grid' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in game-state DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 