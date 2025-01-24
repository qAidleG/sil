import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's collection
    const { data, error } = await supabaseAdmin
      .from('UserCollection')
      .select(`
        *,
        Character:Roster (
          characterid,
          name,
          bio,
          rarity,
          dialogs,
          image1url,
          image2url,
          image3url,
          image4url,
          Series (
            seriesid,
            name,
            universe,
            seriesability
          )
        )
      `)
      .eq('userid', userId)
      .order('favorite', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in characters route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add character to user's collection (gacha pull)
export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get a random unclaimed character
    const { data: character, error: characterError } = await supabaseAdmin
      .from('Roster')
      .select('characterid')
      .eq('claimed', false)
      .limit(1)
      .single()

    if (characterError) {
      console.error('Error getting character:', characterError)
      return NextResponse.json({ error: 'No characters available' }, { status: 400 })
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
      console.error('Error adding to collection:', collectionError)
      return NextResponse.json({ error: 'Failed to add to collection' }, { status: 500 })
    }

    // Mark character as claimed
    const { error: updateError } = await supabaseAdmin
      .from('Roster')
      .update({ claimed: true })
      .eq('characterid', character.characterid)

    if (updateError) {
      console.error('Error updating character:', updateError)
      return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
    }

    // Get current stats
    const { data: stats, error: getStatsError } = await supabaseAdmin
      .from('playerstats')
      .select('cards_collected')
      .eq('userid', userId)
      .single()

    if (getStatsError) {
      console.error('Error getting stats:', getStatsError)
      return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
    }

    // Update cards_collected count
    const { error: statsError } = await supabaseAdmin
      .from('playerstats')
      .upsert({
        userid: userId,
        cards_collected: (stats?.cards_collected || 0) + 1
      })

    if (statsError) {
      console.error('Error updating stats:', statsError)
      return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
    }

    return NextResponse.json({ success: true, characterId: character.characterid })
  } catch (error) {
    console.error('Error in characters POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 