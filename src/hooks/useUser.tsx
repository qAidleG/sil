import { useAuth } from '../app/providers'
import type { AuthContextType } from '../app/providers'

export function useUser(): AuthContextType {
  return useAuth()
} 
