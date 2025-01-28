import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get user's current stats
    const { data: stats } = await supabase
      .from('playerstats')
      .select('cards_collected')
      .eq('userid', userId)
      .single()

    // Only allow claiming if they have no cards
    if (stats && stats.cards_collected > 0) {
      return NextResponse.json({ success: false, error: 'Starter pack already claimed' }, { status: 400 })
    }

    // Get 3 random common characters (rarity 1-2)
    const { data: starterCharacters } = await supabase
      .from('Character')
      .select('characterid')
      .in('rarity', [1, 2])
      .limit(3)
      .order('RANDOM()')

    if (!starterCharacters || starterCharacters.length < 3) {
      return NextResponse.json({ success: false, error: 'Not enough characters available' }, { status: 500 })
    }

    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase.rpc('claim_starter_pack', {
      p_userid: userId,
      p_character_ids: starterCharacters.map(c => c.characterid)
    })

    if (transactionError) {
      throw transactionError
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Starter pack claimed successfully',
      characters: starterCharacters 
    })

  } catch (error) {
    console.error('Starter pack error:', error)
    return NextResponse.json({ success: false, error: 'Failed to claim starter pack' }, { status: 500 })
  }
}