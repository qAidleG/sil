import { supabase } from './supabase'

export async function listTables() {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('schemaname', 'public')
  
  if (error) {
    console.error('Error fetching tables:', error)
    return null
  }
  
  return data
} 