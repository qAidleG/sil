import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code)

      // Get current session to get user details
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
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
              gold: 50,
              moves: 30,
              cards: 0,
              cards_collected: 0,
              email: session.user.email,
              last_move_refresh: new Date().toISOString()
            }])

          if (insertError) {
            console.error('Error initializing player stats:', insertError)
            // Redirect to error page instead of home
            return NextResponse.redirect(new URL('/error?message=Failed%20to%20initialize%20player%20data', requestUrl.origin))
          }
        } else if (statsError) {
          console.error('Error checking player stats:', statsError)
          // Redirect to error page instead of home
          return NextResponse.redirect(new URL('/error?message=Failed%20to%20check%20player%20data', requestUrl.origin))
        }
      }

      // Only redirect to home if everything succeeded
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/error?message=Authentication%20failed', requestUrl.origin))
    }
  }

  // Redirect to home page if no code (shouldn't happen)
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 