import { useAuth } from '../app/providers'
import type { User } from '@supabase/supabase-js'

interface UserContextType {
  user: User | null
  loading: boolean
  userDetails: {
    name: string | null
    avatar_url: string | null
  } | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export function useUser(): UserContextType {
  return useAuth()
} 
