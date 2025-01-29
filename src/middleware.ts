import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
    return res
  }

  // If we have a session, ensure player is initialized
  if (session?.user) {
    try {
      const response = await fetch(`${req.nextUrl.origin}/api/player-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userid: session.user.id,
          email: session.user.email
        })
      })

      if (!response.ok) {
        console.error('Failed to initialize player:', await response.text())
      }
    } catch (error) {
      console.error('Error in player initialization:', error)
    }
  }

  // If user is authenticated, ensure they have player stats
  if (session?.user.id) {
    const { data: stats, error } = await supabase
      .from('playerstats')
      .select('*')
      .eq('userid', session.user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No stats found, create initial stats
      await supabase
        .from('playerstats')
        .insert([{
          userid: session.user.id,
          gold: 0,
          moves: 30,
          cards: 0,
          cards_collected: 0
        }])
    }
  }

  return res
}

export const config = {
  matcher: [
    '/charasphere/:path*',
    '/collections/:path*',
    '/game/:path*',
    '/api/((?!auth|player-init).*)' // Exclude auth and player-init endpoints
  ]
} 