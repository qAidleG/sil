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

    // Get 3 random unclaimed characters
    const { data: characters, error: charError } = await supabase
      .from('Roster')
      .select('characterid, name, rarity, claimed')
      .eq('claimed', false)
      .order('random()')
      .limit(3)

    if (charError) {
      console.error('Error fetching characters:', charError)
      throw charError
    }
    
    // Log available characters
    console.log('Available characters:', characters)

    if (!characters || characters.length < 3) {
      const availableCount = characters?.length ?? 0
      console.error(`Not enough starter characters available (found ${availableCount}):`, characters)
      return NextResponse.json({ 
        success: false, 
        error: `Not enough starter characters available (found ${availableCount}). Please contact the administrator.` 
      }, { status: 400 })
    }

    // Mark characters as claimed
    const { error: updateError } = await supabase
      .from('Roster')
      .update({ claimed: true })
      .in('characterid', characters.map(c => c.characterid))

    if (updateError) {
      console.error('Error marking characters as claimed:', updateError)
      throw updateError
    }

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

    if (collectionError) {
      console.error('Error adding to collection:', collectionError)
      throw collectionError
    }

    // Update player stats
    const { error: statsError } = await supabase
      .from('playerstats')
      .update({ cards: 3 })
      .eq('userid', userId)

    if (statsError) {
      console.error('Error updating player stats:', statsError)
      throw statsError
    }

    return NextResponse.json({ success: true, characters: characters }, { status: 200 })
  } catch (error) {
    console.error('Starter pack error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to claim starter pack'
    }, { status: 500 })
  }
}