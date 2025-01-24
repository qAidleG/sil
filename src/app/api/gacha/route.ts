import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PullResult } from '@/types/database'

const PULL_COST = 100 // Gold cost per pull

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
    const { userid } = await req.json()

    if (!userid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if player has enough gold
    const { data: player, error: playerError } = await supabaseAdmin
      .from('playerstats')
      .select('gold')
      .eq('userid', userid)
      .single()

    if (playerError) {
      console.error('Error checking player gold:', playerError)
      return NextResponse.json({ error: 'Failed to check player gold' }, { status: 500 })
    }

    if (!player || player.gold < PULL_COST) {
      return NextResponse.json({ 
        error: 'Not enough gold', 
        required: PULL_COST, 
        current: player?.gold || 0 
      }, { status: 400 })
    }

    // Perform the pull
    const pullResult = await performPull(userid)
    
    if (!pullResult.success) {
      return NextResponse.json(pullResult, { status: 500 })
    }

    // Update player stats
    const { error: updateError } = await supabaseAdmin
      .from('playerstats')
      .update({ 
        gold: player.gold - PULL_COST,
        cards_collected: supabaseAdmin.rpc('increment_cards_collected')
      })
      .eq('userid', userid)

    if (updateError) {
      console.error('Error updating player stats:', updateError)
      // Don't return error since pull was successful
    }

    return NextResponse.json({
      success: true,
      pull: pullResult,
      gold_remaining: player.gold - PULL_COST
    })

  } catch (error) {
    console.error('Error in gacha pull:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 