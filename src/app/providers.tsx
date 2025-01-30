'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize player data when user signs in
  const initializePlayer = async (userId: string, email: string) => {
    try {
      const { data: existingStats, error: checkError } = await supabase
        .from('playerstats')
        .select('*')
        .eq('userid', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking player stats:', checkError)
        return
      }

      // If player stats don't exist, create them
      if (!existingStats) {
        const { error: insertError } = await supabase
          .from('playerstats')
          .insert({
            userid: userId,
            email: email,
            moves: 30,
            gold: 50,
            last_move_refresh: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating player stats:', insertError)
          toast.error('Failed to initialize player data')
          return
        }

        toast.success('Welcome to the game! Initial stats created.')
      }
    } catch (error) {
      console.error('Error in player initialization:', error)
    }
  }

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        initializePlayer(session.user.id, session.user.email!)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        initializePlayer(session.user.id, session.user.email!)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    // Clear any existing auth state
    await supabase.auth.signOut()
    
    const productionUrl = 'https://sill-git-main-chris-ss-projects-8ecdc1bb.vercel.app'
    const redirectTo = process.env.NODE_ENV === 'production' 
      ? `${productionUrl}`  // Redirect to root in production
      : `${window.location.origin}`  // Redirect to root in development
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 