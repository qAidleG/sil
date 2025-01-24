import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PullResult } from '@/types/game'

// Helper function to perform a single gacha pull
async function performPull(userId: string): Promise<PullResult> {
  try {
    // Get a random unclaimed character
    const { data: character, error: characterError } = await supabaseAdmin
      .from('Roster')
      .select('*, Series(*)')
      .eq('claimed', false)
      .order('random()')
      .limit(1)
      .single()

    if (characterError || !character) {
      return { 
        success: false, 
        error: 'No available characters' 
      }
    }

    // Add to user's collection
    const { error: collectionError } = await supabaseAdmin
      .from('UserCollection')
      .insert({
        userid: userId,
        characterid: character.characterid,
        favorite: false
      })

    if (collectionError) {
      return { 
        success: false, 
        error: 'Failed to add to collection' 
      }
    }

    // Mark character as claimed
    const { error: updateError } = await supabaseAdmin
      .from('Roster')
      .update({ claimed: true })
      .eq('characterid', character.characterid)

    if (updateError) {
      return { 
        success: false, 
        error: 'Failed to update character status' 
      }
    }

    return {
      success: true,
      characterId: character.characterid,
      character: character
    }
  } catch (error) {
    console.error('Pull error:', error)
    return {
      success: false,
      error: 'Internal server error during pull'
    }
  }
}

export async function POST(req: Request) {
  try {
    const { userid, email } = await req.json()

    if (!userid || !email) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 })
    }

    // Check if player already exists
    const { data: existingPlayer, error: checkError } = await supabaseAdmin
      .from('playerstats')
      .select('*')
      .eq('userid', userid)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking player:', checkError)
      return NextResponse.json({ error: 'Failed to check player status' }, { status: 500 })
    }

    if (existingPlayer) {
      return NextResponse.json({
        message: 'Player already exists',
        player: existingPlayer
      })
    }

    // Initialize new player
    const { error: initError } = await supabaseAdmin
      .from('playerstats')
      .insert({
        userid,
        email,
        cards_collected: 0,
        gold: 50
      })

    if (initError) {
      console.error('Error initializing player:', initError)
      return NextResponse.json({ error: 'Failed to initialize player' }, { status: 500 })
    }

    // Perform welcome pulls (3 pulls)
    const pullResults: PullResult[] = []
    for (let i = 0; i < 3; i++) {
      const result = await performPull(userid)
      pullResults.push(result)
      
      if (!result.success) {
        console.error(`Pull ${i + 1} failed:`, result.error)
        // Continue with remaining pulls even if one fails
      }
    }

    // Update cards_collected count
    const successfulPulls = pullResults.filter(r => r.success).length
    if (successfulPulls > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('playerstats')
        .update({ cards_collected: successfulPulls })
        .eq('userid', userid)

      if (updateError) {
        console.error('Error updating cards collected:', updateError)
      }
    }

    return NextResponse.json({
      message: 'Player initialized successfully',
      pulls: pullResults
    })

  } catch (error) {
    console.error('Error in player initialization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 