export interface Character {
  id: number
  name: string
  seriesId: number | null
  bio: string | null
  dialogue: string[]
  createdAt: string
  updatedAt: string
  Series?: Series
}

export interface Series {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  Character?: Character[]
}

export interface GeneratedImage {
  id: number
  prompt: string
  url: string
  createdAt: string
}

export interface UserCollection {
  id: number
  userId: string
  characterId: number
  createdAt: string
  Character?: Character
}

export type NewCharacter = Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
export type NewSeries = Omit<Series, 'id' | 'createdAt' | 'updatedAt'>
export type NewGeneratedImage = Omit<GeneratedImage, 'id' | 'createdAt'>
export type NewUserCollection = Omit<UserCollection, 'id' | 'createdAt'>

export type UpdateCharacter = Partial<NewCharacter>
export type UpdateSeries = Partial<NewSeries> 