import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallback
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
    return ''
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    return ''
  }
  return key
}

// Create public client with auth config
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'charasphere-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'charasphere'
    }
  }
})

// Export a function to get a fresh client
export function getSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'charasphere-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce'
    }
  })
}

// Remove client-side admin checks and exports
export const modifySchema = {
  addColumn: async () => {
    throw new Error('Admin operations not available in client')
  },
  dropColumn: async () => {
    throw new Error('Admin operations not available in client')
  },
  createTable: async () => {
    throw new Error('Admin operations not available in client')
  },
  dropTable: async () => {
    throw new Error('Admin operations not available in client')
  },
  getTableInfo: async () => {
    throw new Error('Admin operations not available in client')
  }
} 