import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch characters
    const { data: characters, error: fetchError } = await supabase
      .from('Character')
      .select('id')

    if (fetchError) throw fetchError
    if (!characters || characters.length === 0) {
      return NextResponse.json(
        { error: 'No starter characters available' },
        { status: 404 }
      )
    }

    // Select 3 random characters
    const selectedCharacters = characters
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Create the collections
    const { error: insertError } = await supabase
      .from('UserCollection')
      .insert(selectedCharacters.map(char => ({
        userId: user.id,
        characterId: char.id
      })))

    if (insertError) throw insertError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in starter pack route:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 