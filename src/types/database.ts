export interface Series {
  id?: number
  seriesid: number
  name: string
  universe: string
  seriesability?: string
}

export interface Character {
  id?: number
  characterid: number
  name: string
  bio: string
  rarity: number
  dialogs: string[]
  image1url?: string
  image2url?: string
  image3url?: string
  image4url?: string
  image5url?: string
  image6url?: string
  claimed: boolean
  selectedImageId?: number
  Series?: {
    id?: number
    seriesid: number
    name: string
    universe: string
    seriesability?: string
  }
}

export interface UserCollection {
  id?: number
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

export interface Roster {
  characterid: number
  name: string
  bio: string
  rarity: number
  dialogs: string[] | null
  image1url: string | null
  image2url: string | null
  image3url: string | null
  image4url: string | null
  image5url: string | null
  image6url: string | null
  claimed: boolean
  Series: {
    seriesid: number
    name: string
    universe: string
    seriesability: string | null
  } | null
}

// Type for updates
export type UpdateCharacter = Partial<Character>
export type UpdateSeries = Partial<Series>
export type UpdateUserCollection = Partial<UserCollection>
export type UpdatePlayerStats = Partial<PlayerStats>
export type UpdateGridProgress = Partial<GridProgress>

// Database response types
export interface DatabaseCharacter {
  characterid: number
  name: string
  bio: string
  rarity: number
  dialogs: string[] | null
  image1url: string | null
  image2url: string | null
  image3url: string | null
  image4url: string | null
  image5url: string | null
  image6url: string | null
  claimed: boolean
  Series: {
    seriesid: number
    name: string
    universe: string
    seriesability: string | null
  } | null
}

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

// Enriched character type that includes user collection data
export interface EnrichedCharacter extends Character {
  selectedImageId: number
  favorite: boolean
  customName?: string
} 