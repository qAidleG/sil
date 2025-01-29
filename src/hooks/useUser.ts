import { useEffect, useState } from 'react'
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs'

export interface AuthUser extends User {
  id: string;
  email?: string;
}

export function useUser() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      setUser(session?.user as AuthUser ?? null)
      setLoading(false)

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user as AuthUser ?? null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    getUser()
  }, [supabase.auth])

  return { user, loading }
} 