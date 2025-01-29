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

    // Get 3 random unclaimed characters (rarity 1-3)
    const { data: characters, error: charError } = await supabase
      .from('Roster')
      .select('*')
      .eq('claimed', false)
      .in('rarity', [1, 2, 3])
      .limit(3)

    if (charError) throw charError
    if (!characters || characters.length < 3) {
      return NextResponse.json({ success: false, error: 'Not enough characters available' }, { status: 400 })
    }

    // Mark characters as claimed
    const { error: updateError } = await supabase
      .from('Roster')
      .update({ claimed: true })
      .in('characterid', characters.map(c => c.characterid))

    if (updateError) throw updateError

    // Add characters to user's collection
    const { error: collectionError } = await supabase
      .from('UserCollection')
      .insert(
        characters.map(char => ({
          userid: userId,
          characterid: char.characterid,
          favorite: false
        }))
      )

    if (collectionError) throw collectionError

    // Update player stats
    const { error: statsError } = await supabase
      .from('playerstats')
      .update({ cards: 3 })
      .eq('userid', userId)

    if (statsError) throw statsError

    return NextResponse.json({ success: true, characters: characters }, { status: 200 })
  } catch (error) {
    console.error('Starter pack error:', error)
    return NextResponse.json({ success: false, error: 'Failed to claim starter pack' }, { status: 500 })
  }
}