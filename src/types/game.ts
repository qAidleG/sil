import { Roster } from './database'

// Grid Types
export type BaseTileType = 
  | 'G1' | 'G2' | 'G3'  // Gold tiles (1d3+3, 2d3+3, 3d3+3)
  | 'E1' | 'E2' | 'E3'  // Event tiles
  | 'P1' | 'P2' | 'P3' | 'P4'  // Character tiles

export type TileType = BaseTileType | 'P' | 'C'  // P = Player, C = Claimed/Completed

export interface GridTile {
  id: number
  type: TileType
  characterId?: number  // For character tiles (P1-P4)
}

// Initial grid layout - used to initialize new games
export const INITIAL_GRID_LAYOUT: GridTile[] = [
  { id: 1, type: 'G1' },
  { id: 2, type: 'G2' },
  { id: 3, type: 'G3' },
  { id: 4, type: 'E1' },
  { id: 5, type: 'E2' },
  { id: 6, type: 'E3' },
  { id: 7, type: 'G1' },
  { id: 8, type: 'G1' },
  { id: 9, type: 'G1' },
  { id: 10, type: 'G1' },
  { id: 11, type: 'G1' },
  { id: 12, type: 'G1' },
  { id: 13, type: 'P' },   // Player starting position
  { id: 14, type: 'G2' },
  { id: 15, type: 'G2' },
  { id: 16, type: 'G2' },
  { id: 17, type: 'G2' },
  { id: 18, type: 'G2' },
  { id: 19, type: 'G2' },
  { id: 20, type: 'G3' },
  { id: 21, type: 'G3' },
  { id: 22, type: 'G3' },
  { id: 23, type: 'P1' },
  { id: 24, type: 'P2' },
  { id: 25, type: 'P3' },
  { id: 26, type: 'P4' }
]

// Helper functions for game logic
export function calculateGoldReward(tileType: 'G1' | 'G2' | 'G3'): number {
  const rollD3 = () => Math.floor(Math.random() * 3) + 1
  
  switch (tileType) {
    case 'G1':
      return rollD3() + 3  // 1d3 + 3 (4-6)
    case 'G2':
      return rollD3() + rollD3() + 3  // 2d3 + 3 (5-9)
    case 'G3':
      return rollD3() + rollD3() + rollD3() + 3  // 3d3 + 3 (6-12)
  }
}

// Game state types
export interface GameState {
  tilemap: GridTile[]
  goldCollected: number
  playerPosition: number  // tile ID where player is
  isCompleting?: boolean  // Whether the board completion animation is showing
}

export interface NewPlayer {
  userid: string
  email: string
  initial_gold?: number // Default to 50
  welcome_pulls?: number // Default to 3
}

export interface PullResult {
  success: boolean
  characterId?: number
  character?: Roster
  error?: string
}

export type NewUserCollection = {
  userid: string
  characterid: number
  customName?: string | null
  favorite: boolean
  selectedImageId?: number | null
} 