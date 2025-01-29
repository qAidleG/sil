import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // For protected routes, redirect to login if no session
  if (isProtectedRoute(req.nextUrl.pathname) && (!session || sessionError)) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If we have a session, ensure player is initialized
  if (session?.user) {
    try {
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
            cards_collected: 0,
            email: session.user.email
          }])
      }
    } catch (error) {
      console.error('Error in player initialization:', error)
      // Continue anyway - don't block the request
    }
  }

  return res
}

// Helper to check if route requires auth
function isProtectedRoute(pathname: string): boolean {
  return [
    '/charasphere',
    '/collections',
    '/game',
    '/tldraw',
    '/chatbot'
  ].some(route => pathname.startsWith(route))
}

export const config = {
  matcher: [
    '/',
    '/charasphere/:path*',
    '/collections/:path*',
    '/game/:path*',
    '/tldraw/:path*',
    '/chatbot/:path*',
    '/api/((?!auth).*)' // Exclude auth endpoints
  ]
} 