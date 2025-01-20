'use client'

import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Dev mode flag - set to true to bypass auth
const DEV_MODE = true

export default function CharaSphereLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        if (DEV_MODE) {
          // Use a dev user in dev mode
          setUser({
            id: 'dev-user-id',
            email: 'dev@example.com',
            role: 'developer'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
          </div>
        </div>
      </main>
    )
  }

  // Only show sign in if not in dev mode and no user
  if (!user && !DEV_MODE) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <StarField />
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-2xl font-bold text-blue-400 mb-6">Welcome to CharaSphere</h2>
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.href
                }
              })}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
            >
              Sign in with Google to Play
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
        <div className="mb-6 flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <Home size={20} />
            <span>Home</span>
          </Link>
          <span className="text-gray-600">/</span>
          <Link href="/charasphere" className="text-blue-400 hover:text-blue-300 transition-colors">
            CharaSphere
          </Link>
          {DEV_MODE && (
            <span className="ml-auto px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-md">
              Dev Mode
            </span>
          )}
        </div>

        {children}
      </div>
    </main>
  )
} 