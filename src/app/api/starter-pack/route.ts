import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { initializePlayerStats } from '@/lib/database'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    // Initialize both clients
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore,
    })
    
    // Get the current session to verify the user
    const sessionResponse = await supabase.auth.getSession()
    console.log('Session response:', JSON.stringify(sessionResponse, null, 2))
    
    const session = sessionResponse.data.session
    if (!session?.user?.id) {
      console.log('No session or user found')
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated',
        debug: { sessionResponse }
      }, { status: 401 })
    }

    // Validate request body
    let userId: string
    try {
      const body = await request.json()
      userId = body.userId
      if (!userId) throw new Error('Missing userId in request body')
    } catch (e) {
      console.error('Invalid request body:', e)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request format',
        debug: { error: e instanceof Error ? e.message : 'Unknown error' }
      }, { status: 400 })
    }

    // Verify user ID match
    if (userId !== session.user.id) {
      console.log('User ID mismatch:', { providedId: userId, sessionUserId: session.user.id })
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID',
        debug: { providedId: userId, sessionUserId: session.user.id }
      }, { status: 400 })
    }

    // Ensure player stats exist (with retries)
    let stats = null
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        stats = await initializePlayerStats(userId, session.user.email!)
        break
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        if (attempts === maxAttempts - 1) throw error
        attempts++
        await wait(1000) // Wait 1 second between retries
      }
    }

    if (!stats) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify player stats',
        debug: { userId }
      }, { status: 500 })
    }

    // Check for existing cards (with retries)
    let existingCards = null
    attempts = 0

    while (attempts < maxAttempts) {
      try {
        const { count, error } = await supabaseAdmin
          .from('UserCollection')
          .select('*', { count: 'exact', head: true })
          .eq('userid', userId)

        if (error) throw error
        existingCards = count
        break
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        if (attempts === maxAttempts - 1) throw error
        attempts++
        await wait(1000)
      }
    }

    if (existingCards === null) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing cards',
        debug: { attempts }
      }, { status: 500 })
    }

    if (existingCards > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already claimed your starter pack',
        debug: { existingCards }
      }, { status: 400 })
    }

    // Get 3 random unclaimed high-rarity characters (with retries)
    let characters = null
    attempts = 0

    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabaseAdmin
          .from('Roster')
          .select('characterid, name, rarity, claimed')
          .eq('claimed', false)
          .gte('rarity', 4)
          .lte('rarity', 6)
          .order('random()')
          .limit(3)

        if (error) throw error
        characters = data
        break
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        if (attempts === maxAttempts - 1) throw error
        attempts++
        await wait(1000)
      }
    }

    if (!characters || characters.length < 3) {
      const availableCount = characters?.length ?? 0
      console.error(`Not enough high-rarity starter characters available (found ${availableCount}):`, characters)
      return NextResponse.json({ 
        success: false, 
        error: 'Not enough starter characters available. Please contact the administrator.',
        debug: { availableCount, characters }
      }, { status: 400 })
    }

    // Mark characters as claimed and add to collection (with retries)
    attempts = 0

    while (attempts < maxAttempts) {
      try {
        // Start a transaction
        const { error: updateError } = await supabaseAdmin
          .from('Roster')
          .update({ claimed: true })
          .in('characterid', characters.map(c => c.characterid))

        if (updateError) throw updateError

        const { error: insertError } = await supabaseAdmin
          .from('UserCollection')
          .insert(
            characters.map(char => ({
              userid: userId,
              characterid: char.characterid,
              favorite: false
            }))
          )

        if (insertError) throw insertError

        const { error: statsError } = await supabaseAdmin
          .from('playerstats')
          .update({ 
            cards: 3,
            gold: supabaseAdmin.rpc('increment_gold', { amount: 100 })
          })
          .eq('userid', userId)

        if (statsError) throw statsError

        break
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error)
        if (attempts === maxAttempts - 1) throw error
        attempts++
        await wait(1000)
      }
    }

    return NextResponse.json({ 
      success: true, 
      characters: characters,
      debug: {
        userId,
        characterIds: characters.map(c => c.characterid)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Starter pack error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to claim starter pack',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
}