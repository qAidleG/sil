import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type {
  Character,
  Series,
  UserCollection,
  NewCharacter,
  NewSeries,
  NewUserCollection,
  UpdateCharacter,
  UpdateSeries,
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

export const createCharacter = async (character: NewCharacter) => {
  const { data, error } = await supabase
    .from('Character')
    .insert([character])
    .select()
  
  if (error) throw error
  return data[0] as Character
}

export const updateCharacter = async (id: number, updates: UpdateCharacter) => {
  const { data, error } = await supabase
    .from('Character')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0] as Character
}

export const deleteCharacter = async (id: number) => {
  const { error } = await supabase
    .from('Character')
    .delete()
    .eq('id', id)
  
  if (error) throw error
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

export const getSeriesById = async (id: number) => {
  const { data, error } = await supabase
    .from('Series')
    .select(`
      *,
      Character (
        id,
        name,
        bio
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Series
}

export const createSeries = async (series: NewSeries) => {
  const { data, error } = await supabase
    .from('Series')
    .insert([series])
    .select()
  
  if (error) throw error
  return data[0] as Series
}

export const updateSeries = async (id: number, updates: UpdateSeries) => {
  const { data, error } = await supabase
    .from('Series')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0] as Series
}

export const deleteSeries = async (id: number) => {
  const { error } = await supabase
    .from('Series')
    .delete()
    .eq('id', id)
  
  if (error) throw error
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

export const removeFromUserCollection = async (id: number) => {
  const { error } = await supabase
    .from('UserCollection')
    .delete()
    .eq('id', id)
  
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