import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    // Verify auth session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized'
      })
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
        userId: session.user.id,
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