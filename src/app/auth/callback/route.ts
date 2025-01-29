import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)

    // Get current session to get user details
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      try {
        // Check if player stats exist
        const { data: stats, error: statsError } = await supabase
          .from('playerstats')
          .select('*')
          .eq('userid', session.user.id)
          .single()

        if (statsError && statsError.code === 'PGRST116') {
          // Initialize player stats if they don't exist
          const { error: insertError } = await supabase
            .from('playerstats')
            .insert([{
              userid: session.user.id,
              gold: 0,
              moves: 30,
              cards: 0,
              email: session.user.email,
              last_move_refresh: new Date().toISOString()
            }])

          if (insertError) {
            console.error('Error initializing player stats:', insertError)
            throw insertError
          }
        } else if (statsError) {
          console.error('Error checking player stats:', statsError)
          throw statsError
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        // Still redirect to home page where error will be handled
      }
    }
  }

  // Redirect to the home page
  return NextResponse.redirect(requestUrl.origin)
} 