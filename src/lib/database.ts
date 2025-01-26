import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type {
  Character,
  Series,
  UserCollection,
  NewSeries,
  NewUserCollection,
  UpdateSeries,
  UpdateUserCollection,
} from '@/types/database'

// Character Operations
export const getCharacter = async (characterid: number) => {
  const { data, error } = await supabase
    .from('Roster')
    .select(`
      *,
      Series (
        name,
        universe,
        seriesability
      )
    `)
    .eq('characterid', characterid)
    .single()
  
  if (error) throw error
  return data as Character
}

export async function getCharacters(userId: string, showAll: boolean = false) {
  let query = supabase
    .from('Roster')
    .select(`
      *,
      Series (
        name,
        universe,
        seriesability
      )
    `)
    .order('name')

  if (!showAll) {
    // Only show claimed characters for the user
    const { data: userCollection } = await supabase
      .from('UserCollection')
      .select('characterid')
      .eq('userid', userId)

    if (userCollection) {
      const characterIds = userCollection.map(uc => uc.characterid)
      query = query.in('characterid', characterIds)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data as Character[]
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
export const getUserCollection = async (userId: string) => {
  const { data, error } = await supabase
    .from('UserCollection')
    .select(`
      *,
      Roster (
        *,
        Series (
          name,
          universe,
          seriesability
        )
      )
    `)
    .eq('userid', userId)
  
  if (error) throw error
  return data as UserCollection[]
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