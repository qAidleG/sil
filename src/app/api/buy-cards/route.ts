import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const CARD_COST = 200 // Cost in gold per card

export async function POST(req: Request) {
  try {
    const { userId, quantity = 1 } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current player stats
    const { data: player, error: playerError } = await supabaseAdmin
      .from('playerstats')
      .select('gold, cards')
      .eq('userid', userId)
      .single()

    if (playerError) {
      return NextResponse.json({ error: 'Failed to get player stats' }, { status: 500 })
    }

    const totalCost = CARD_COST * quantity

    // Check if player has enough gold
    if (player.gold < totalCost) {
      return NextResponse.json({ 
        error: `Not enough gold! Cards cost ${CARD_COST} gold each.`,
        requiredGold: totalCost,
        currentGold: player.gold
      }, { status: 400 })
    }

    // Update player stats
    const { error: updateError } = await supabaseAdmin
      .from('playerstats')
      .update({ 
        gold: player.gold - totalCost,
        cards: player.cards + quantity
      })
      .eq('userid', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update player stats' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newGold: player.gold - totalCost,
      newCards: player.cards + quantity,
      cost: totalCost
    })

  } catch (error) {
    console.error('Error buying cards:', error)
    return NextResponse.json({ error: 'Failed to buy cards' }, { status: 500 })
  }
} 