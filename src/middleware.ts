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

  return res
}

export const config = {
  matcher: [
    '/charasphere/:path*',
    '/api/((?!auth|player-init).*)' // Exclude auth and player-init endpoints
  ]
} 