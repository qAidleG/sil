import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create public client with simplified config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client (for schema modifications and admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    })
  : null

// Schema modification functions
export const modifySchema = {
  addColumn: async (table: string, column: string, type: string) => {
    if (!supabaseAdmin) throw new Error('Admin client not configured')
    
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      query: `ALTER TABLE "${table}" ADD COLUMN "${column}" ${type};`
    })
    
    if (error) throw error
  },

  dropColumn: async (table: string, column: string) => {
    if (!supabaseAdmin) throw new Error('Admin client not configured')
    
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      query: `ALTER TABLE "${table}" DROP COLUMN "${column}";`
    })
    
    if (error) throw error
  },

  createTable: async (table: string, columns: Record<string, string>) => {
    if (!supabaseAdmin) throw new Error('Admin client not configured')
    
    const columnDefs = Object.entries(columns)
      .map(([name, type]) => `"${name}" ${type}`)
      .join(', ')
    
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      query: `CREATE TABLE "${table}" (${columnDefs});`
    })
    
    if (error) throw error
  },

  dropTable: async (table: string) => {
    if (!supabaseAdmin) throw new Error('Admin client not configured')
    
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      query: `DROP TABLE IF EXISTS "${table}";`
    })
    
    if (error) throw error
  },

  // Get table information
  getTableInfo: async (table: string) => {
    if (!supabaseAdmin) throw new Error('Admin client not configured')
    
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = '${table}';
      `
    })
    
    if (error) throw error
    return data
  }
} 