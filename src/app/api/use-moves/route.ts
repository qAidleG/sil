import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { userId, moves } = await req.json()

    if (!userId || typeof moves !== 'number') {
      return NextResponse.json({ error: 'User ID and moves are required' }, { status: 400 })
    }

    // Get current moves
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('moves')
      .eq('userid', userId)
      .single()

    if (statsError) {
      throw statsError
    }

    if (stats.moves < moves) {
      return NextResponse.json({ error: 'Not enough moves' }, { status: 400 })
    }

    // Update moves
    const { error: updateError } = await supabaseAdmin
      .from('playerstats')
      .update({ moves: stats.moves - moves })
      .eq('userid', userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      remainingMoves: stats.moves - moves
    })

  } catch (error) {
    console.error('Error using moves:', error)
    return NextResponse.json({ error: 'Failed to use moves' }, { status: 500 })
  }
} 