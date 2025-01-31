import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Get the current session to verify the user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 })
    }

    // Use admin client for operations that need to bypass RLS
    const { count: existingCards, error: countError } = await supabaseAdmin
      .from('UserCollection')
      .select('*', { count: 'exact', head: true })
      .eq('userid', userId)

    if (countError) {
      console.error('Error checking existing cards:', countError)
      throw countError
    }

    if (existingCards && existingCards > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already claimed your starter pack' 
      }, { status: 400 })
    }

    // Get 3 random unclaimed high-rarity characters
    const { data: characters, error: charError } = await supabaseAdmin
      .from('Roster')
      .select('characterid, name, rarity, claimed')
      .eq('claimed', false)
      .gte('rarity', 4)
      .lte('rarity', 6)
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
      console.error(`Not enough high-rarity starter characters available (found ${availableCount}):`, characters)
      return NextResponse.json({ 
        success: false, 
        error: `Not enough starter characters available. Please contact the administrator.` 
      }, { status: 400 })
    }

    // Mark characters as claimed using admin client
    const { error: updateError } = await supabaseAdmin
      .from('Roster')
      .update({ claimed: true })
      .in('characterid', characters.map(c => c.characterid))

    if (updateError) {
      console.error('Error marking characters as claimed:', updateError)
      throw updateError
    }

    // Add characters to user's collection using admin client
    const { error: collectionError } = await supabaseAdmin
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

    // Update player stats with cards and bonus gold using admin client
    const { error: statsError } = await supabaseAdmin
      .from('playerstats')
      .update({ 
        cards: 3,
        gold: supabaseAdmin.rpc('increment_gold', { amount: 100 })  // Add bonus gold
      })
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