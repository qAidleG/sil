import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create public client with auth config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'charasphere-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

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