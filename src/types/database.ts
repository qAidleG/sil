export interface Series {
  id?: number
  seriesid: number
  name: string
  universe: string
  seriesability?: string
  createdAt: string
  updatedAt: string
}

export interface Character {
  characterid: number
  name: string
  bio: string
  rarity: number
  seriesid: number
  dialogs: string[] | null
  image1url: string | null
  image2url: string | null
  image3url: string | null
  image4url: string | null
  image5url: string | null
  image6url: string | null
  claimed: boolean
  Series?: {
    seriesid: number
    name: string
    universe: string
    seriesability: string | null
  } | null
}

export interface UserCollection {
  id: number
  userid: string
  characterid: number
  customName?: string
  favorite: boolean
  selectedImageId?: number
}

export interface PlayerStats {
  userid: string
  turns: number
  gold: number
  email?: string
}

export interface GridProgress {
  id?: number
  userid: string
  tilemap: any
  clearreward?: any
}

// Type for updates
export type UpdateCharacter = Partial<Character>
export type UpdateSeries = Partial<Series>
export type UpdateUserCollection = Partial<UserCollection>
export type UpdatePlayerStats = Partial<PlayerStats>
export type UpdateGridProgress = Partial<GridProgress>

// Database response types
export interface DatabaseCharacter extends Character {}

// Type guard for DatabaseCharacter
export function isDatabaseCharacter(obj: any): obj is DatabaseCharacter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.characterid === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.bio === 'string' &&
    typeof obj.rarity === 'number' &&
    (obj.dialogs === null || Array.isArray(obj.dialogs)) &&
    typeof obj.claimed === 'boolean' &&
    (obj.Series === null ||
      (typeof obj.Series === 'object' &&
        obj.Series !== null &&
        typeof obj.Series.seriesid === 'number' &&
        typeof obj.Series.name === 'string' &&
        typeof obj.Series.universe === 'string'))
  )
}

export interface NewCharacter {
  name: string
  bio: string
  rarity: number
  seriesid: number
  dialogs: string[]
}

export interface NewSeries {
  name: string
  universe: string
}

export interface NewUserCollection {
  userid: string
  characterid: number
  customName?: string | null
  favorite: boolean
  selectedImageId?: number | null
} 