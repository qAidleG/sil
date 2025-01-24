import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PullResult } from '@/types/game'

const PULL_COST = 100 // Gold cost per pull

// Helper function to perform a single gacha pull
async function performPull(userId: string): Promise<PullResult> {
  try {
    // First check if user has enough gold
    const { data: playerStats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('gold, cards_collected')
      .eq('userid', userId)
      .single()

    if (statsError || !playerStats) {
      return { 
        success: false, 
        error: 'Failed to check player stats' 
      }
    }

    if (playerStats.gold < PULL_COST) {
      return {
        success: false,
        error: `Not enough gold (requires ${PULL_COST})`
      }
    }

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

    // Mark character as claimed and update player stats
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

    // Update player stats
    const { error: statsUpdateError } = await supabaseAdmin
      .from('playerstats')
      .update({ 
        gold: playerStats.gold - PULL_COST,
        cards_collected: playerStats.cards_collected + 1
      })
      .eq('userid', userId)

    if (statsUpdateError) {
      return {
        success: false,
        error: 'Failed to update player stats'
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

    const result = await performPull(userid)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in pull endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 