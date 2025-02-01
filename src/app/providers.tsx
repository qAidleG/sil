'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { initializePlayerStats } from '@/lib/database'

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  userDetails: {
    name: string | null
    avatar_url: string | null
  } | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  userDetails: null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userDetails, setUserDetails] = useState<{ name: string | null; avatar_url: string | null } | null>(null)

  // Initialize player data when user signs in
  const initializePlayer = async (userId: string, email: string) => {
    try {
      await initializePlayerStats(userId, email)
      toast.success('Welcome to the game!')
    } catch (error) {
      console.error('Error in player initialization:', error)
      toast.error('Failed to initialize player data')
    }
  }

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Get user details from metadata
        const { user_metadata } = session.user
        setUserDetails({
          name: user_metadata?.full_name || user_metadata?.name || null,
          avatar_url: user_metadata?.avatar_url || null
        })
        initializePlayer(session.user.id, session.user.email!)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const previousUser = user
      const currentUser = session?.user ?? null
      
      setUser(currentUser)
      
      if (currentUser && (!previousUser || previousUser.id !== currentUser.id)) {
        // Get user details from metadata
        const { user_metadata } = currentUser
        setUserDetails({
          name: user_metadata?.full_name || user_metadata?.name || null,
          avatar_url: user_metadata?.avatar_url || null
        })
        await initializePlayer(currentUser.id, currentUser.email!)
      } else if (!currentUser) {
        setUserDetails(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [user]) // Add user to dependency array to track changes

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
    <AuthContext.Provider value={{ user, loading, signIn, signOut, userDetails }}>
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