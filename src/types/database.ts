export interface Character {
  id: number
  name: string
  bio: string | null
  rarity: number
  seriesId: number | null
  dialogs: string[]
  Series?: {
    id: number
    name: string
    universe: string
  }
  GeneratedImage?: {
    id: number
    characterId: number
    url: string
    prompt: string
    style: string
    createdAt: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface Series {
  id: number
  name: string
  universe: string
  createdAt: string
  updatedAt: string
  Character?: Character[]
}

export interface GeneratedImage {
  id: number
  characterId: number | null
  collectionId: number | null
  seed: number
  prompt: string
  style: string
  url: string
  createdAt: string
  updatedAt: string
  Character?: Character
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
export type NewGeneratedImage = Omit<GeneratedImage, 'id' | 'createdAt' | 'updatedAt'>
export type NewUserCollection = Omit<UserCollection, 'id' | 'createdAt'>

export type UpdateCharacter = Partial<NewCharacter>
export type UpdateSeries = Partial<NewSeries>
export type UpdateGeneratedImage = Partial<NewGeneratedImage> 