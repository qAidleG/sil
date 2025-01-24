export interface Series {
  seriesid: number
  name: string
  universe: string
  seriesability: string | null
}

export interface Character {
  characterid: number
  name: string
  seriesId: number
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
  Series?: Series
}

export interface UserCollection {
  id: number
  userid: string
  characterid: number
  customName: string | null
  favorite: boolean
  selectedImageId: number | null
  Character?: Character
}

export interface PlayerStats {
  userid: string
  email: string
  cards_collected: number
  gold: number
  wins: number
  losses: number
  rank: number
  experience: number
  moves: number
  last_move_refresh: string
  created_at: string
  updated_at: string
}

export interface GridProgress {
  id: number
  userid: string
  discoveredTiles: any // JSONB type
  goldCollected: number
  created_at: string
  updated_at: string
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