import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type {
  Character,
  Series,
  GeneratedImage,
  UserCollection,
  NewCharacter,
  NewSeries,
  NewGeneratedImage,
  NewUserCollection,
  UpdateCharacter,
  UpdateSeries,
} from '@/types/database'

// Character Operations
export const getCharacters = async (userId: string, showAll: boolean = false) => {
  try {
    console.log('Fetching all characters');
    
    const response = await fetch('/api/characters');
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const data = await response.json();
    console.log('Character query result:', { data });
    
    return data as Character[];
  } catch (error) {
    console.error('Error in getCharacters:', error);
    return [];
  }
}

export const getCharacterById = async (id: number) => {
  const { data, error } = await supabase
    .from('Character')
    .select(`
      *,
      Series (
        id,
        name,
        description
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Character
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
      Character (
        id,
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

// Generated Image Operations
export const getGeneratedImages = async (limit = 50) => {
  const { data, error } = await supabase
    .from('GeneratedImage')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data as GeneratedImage[]
}

export const createGeneratedImage = async (image: NewGeneratedImage) => {
  const { data, error } = await supabase
    .from('GeneratedImage')
    .insert([image])
    .select()
  
  if (error) throw error
  return data[0] as GeneratedImage
}

export const deleteGeneratedImage = async (id: number) => {
  const { error } = await supabase
    .from('GeneratedImage')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// User Collection Operations
export const getUserCollections = async (userId: string) => {
  const { data, error } = await supabase
    .from('UserCollection')
    .select(`
      *,
      Character (
        id,
        name,
        bio,
        Series (
          id,
          name
        )
      )
    `)
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
  
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

export const giveStarterPack = async (userId: string) => {
  try {
    // Check if user is authenticated and matches provided userId
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    if (user.id !== userId) throw new Error('User ID mismatch');

    // Fetch characters with regular client
    const { data: characters, error: fetchError } = await supabase
      .from('Character')
      .select('id');

    if (fetchError) throw fetchError;
    if (!characters || characters.length === 0) throw new Error('No starter characters available');

    // Select 3 random characters
    const selectedCharacters = characters
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Create the collections using regular client
    const { error: insertError } = await supabase
      .from('UserCollection')
      .insert(selectedCharacters.map(char => ({
        userId: userId,
        characterId: char.id
      })));

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('Error giving starter pack:', error);
    handleDatabaseError(error);
    return false;
  }
} 