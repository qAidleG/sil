import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabase-admin'
import type {
  Roster,
  Series,
  UserCollection,
  NewSeries,
  NewRoster,
  NewUserCollection,
  PlayerStats,
  UpdatePlayerStats,
  UpdateRoster,
  UpdateSeries,
  UpdateUserCollection,
  GridProgress,
  UpdateGridProgress
} from '@/types/database'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Character Operations
export async function getCharacter(id: number): Promise<Roster> {
  const { data, error } = await supabase
    .from('Roster')
    .select('*, Series(*)')
    .eq('characterid', id)
    .single()
    
  if (error) throw error
  return data as Roster
}

export async function getCharacters(): Promise<Roster[]> {
  const query = supabase
    .from('Roster')
    .select(`
      *,
      Series (
        seriesid,
        name,
        universe
      )
    `)
    .order('name')
    
  const { data, error } = await query
  if (error) throw error
  return data as Roster[]
}

// Series Operations
export const getSeries = async () => {
  const { data, error } = await supabase
    .from('Series')
    .select(`
      *,
      Roster (
        characterid,
        name
      )
    `)
    .order('name')
  
  if (error) throw error
  return data as Series[]
}

export const getSeriesById = async (seriesid: number) => {
  const { data, error } = await supabase
    .from('Series')
    .select(`
      *,
      Roster (
        characterid,
        name,
        bio
      )
    `)
    .eq('seriesid', seriesid)
    .single()
  
  if (error) throw error
  return data as Series
}

// User Collection Operations
export async function getUserCollection(userId: string): Promise<UserCollection[]> {
  const { data, error } = await supabase
    .from('UserCollection')
    .select(`
      *,
      Roster (
        *,
        Series (*)
      )
    `)
    .eq('userid', userId)
    .order('id')
  
  if (error) throw error
  return data.map((uc: UserCollection) => ({
    ...uc,
    Roster: uc.Roster as Roster
  }))
}

export const addToUserCollection = async (collection: NewUserCollection) => {
  const { data, error } = await supabase
    .from('UserCollection')
    .insert([collection])
    .select()
  
  if (error) throw error
  return data[0] as UserCollection
}

export const removeFromUserCollection = async (userId: string, characterId: number) => {
  const { error } = await supabase
    .from('UserCollection')
    .delete()
    .eq('userid', userId)
    .eq('characterid', characterId)
  
  if (error) throw error
}

export const updateUserCollection = async (userId: string, characterId: number, updates: Partial<UserCollection>) => {
  const { data, error } = await supabase
    .from('UserCollection')
    .update(updates)
    .eq('userid', userId)
    .eq('characterid', characterId)
    .select()
  
  if (error) throw error
  return data[0] as UserCollection
}

// Error Handling Wrapper
export const handleDatabaseError = (error: any) => {
  if (error.code === 'PGRST116') {
    throw new Error('Access denied. Please check your permissions.')
  } else if (error.code === '23503') {
    throw new Error('Referenced record does not exist.')
  } else if (error.code === '23505') {
    throw new Error('Record already exists.')
  } else {
    console.error('Database error:', error)
    throw new Error('An unexpected database error occurred.')
  }
}

export async function getPlayerStats(userId: string): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from('playerstats')
    .select('*')
    .eq('userid', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function updatePlayerStats(
  userId: string,
  updates: UpdatePlayerStats
): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('playerstats')
    .update(updates)
    .eq('userid', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getGridProgress(userId: string): Promise<GridProgress | null> {
  const { data, error } = await supabase
    .from('gridprogress')
    .select('*')
    .eq('userid', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function updateGridProgress(
  userId: string,
  updates: UpdateGridProgress
): Promise<GridProgress> {
  const { data, error } = await supabase
    .from('gridprogress')
    .update(updates)
    .eq('userid', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function createGridProgress(
  userId: string,
  initialData: Partial<GridProgress>
): Promise<GridProgress> {
  const { data, error } = await supabase
    .from('gridprogress')
    .insert([{ userid: userId, ...initialData }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteGridProgress(userId: string): Promise<void> {
  const { error } = await supabase
    .from('gridprogress')
    .delete()
    .eq('userid', userId)
  
  if (error) throw error
} 