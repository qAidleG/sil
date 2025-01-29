export interface Series {
  seriesid: number
  name: string
  universe: string
  seriesability?: string | null
}

export interface Roster {
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
  Series?: Series | null
}

export interface UserCollection {
  id: number
  userid: string
  characterid: number
  customName?: string | null
  favorite: boolean
  selectedImageId?: number | null
  Roster?: Roster
}

export interface PlayerStats {
  id: string
  created_at: string
  userid: string
  gold: number
  moves: number
  cards: number
  cards_collected: number
  email: string
}

// Initial stats for new players
export const INITIAL_PLAYER_STATS: Partial<PlayerStats> = {
  gold: 0,
  moves: 30,
  cards: 0,
  cards_collected: 0
}

export interface GridProgress {
  id?: number
  userid: string
  tilemap: any
  clearreward?: any
}

// Type for updates
export type UpdateRoster = Partial<Roster>
export type UpdateSeries = Partial<Series>
export type UpdateUserCollection = Partial<UserCollection>
export type UpdatePlayerStats = Partial<PlayerStats>
export type UpdateGridProgress = Partial<GridProgress>

// Type guard for Roster
export function isDatabaseCharacter(obj: any): obj is Roster {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.characterid === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.bio === 'string' &&
    typeof obj.rarity === 'number' &&
    typeof obj.seriesid === 'number' &&
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

export interface NewRoster {
  name: string
  bio: string
  rarity: number
  seriesid: number
  dialogs: string[]
}

export interface NewSeries {
  name: string
  universe: string
  seriesability?: string
}

export interface NewUserCollection {
  userid: string
  characterid: number
  customName?: string | null
  favorite: boolean
  selectedImageId?: number | null
} 