'use client'

import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { PlayerStats } from '@/components/PlayerStats'

export default function CharaSphereLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    const getUser = async () => {
      try {
        if (isDevelopment) {
          setUser({
            id: 'dev-user-id',
            email: 'dev@example.com'
          })
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
        }
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <StarField />
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </div>
      </main>
    )
  }

  if (!user && !isDevelopment) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <StarField />
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-xl text-gray-400 mb-4">Please sign in to access CharaSphere</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.href
                }
              })}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Navigation */}
        <nav className="mb-6 flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <Home size={20} />
            <span>Home</span>
          </Link>
          {/* Only show CharaSphere link if we're not on the main CharaSphere page */}
          {window.location.pathname !== '/charasphere' && (
            <>
              <span className="text-gray-600">/</span>
              <Link href="/charasphere" className="text-blue-400 hover:text-blue-300 transition-colors">
                CharaSphere
              </Link>
            </>
          )}
        </nav>

        {/* Player Stats */}
        <PlayerStats className="mb-4" />

        {children}
      </div>
    </main>
  )
} 