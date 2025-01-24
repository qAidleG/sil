export interface Series {
  seriesid: number
  name: string
  universe: string
  seriesability: string | null
}

export interface Roster {
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
  Character?: Roster
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

export interface Character {
  id: number
  name: string
  description: string
  imageUrl: string
  rarity: number
}

// Type for updates
export type UpdateRoster = Partial<Roster>
export type UpdateSeries = Partial<Series>
export type UpdateUserCollection = Partial<UserCollection>
export type UpdatePlayerStats = Partial<PlayerStats>
export type UpdateGridProgress = Partial<GridProgress> 