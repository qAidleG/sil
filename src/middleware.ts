import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // If we have a session, ensure player is initialized
  if (session?.user) {
    const response = await fetch(`${req.nextUrl.origin}/api/player-init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: session.user.id,
        email: session.user.email
      })
    })

    if (!response.ok) {
      console.error('Failed to initialize player:', await response.text())
    }
  }

  return res
}

export const config = {
  matcher: [
    '/collections/:path*',
    '/api/starter-pack',
    '/game/:path*'  // Add game routes to protected paths
  ]
} 