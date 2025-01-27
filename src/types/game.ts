import { Character } from './database'

// Grid Types
export type TileType = 'G' | 'C' | 'C1' | 'C2' | 'C3' | 'C4' | 'P'  // Added P back for player position

export interface GridTile {
  id: number
  type: TileType
  x: number
  y: number
  characterId?: number
  character?: Character
  discovered: boolean  // Track if tile has been visited
}

// Game State
export interface GameState {
  userId: string
  tilemap: GridTile[]
  gold: number
  goldCollected: number
  turns: number
  unlockedTiers: string[]  // Track which character tiers are unlocked
  gridCleared: boolean     // Track if entire grid is discovered
}

// Reward Calculation
export function calculateGoldReward(tile: GridTile): number {
  switch (tile.type) {
    case 'G': return 5     // Basic gold tile
    case 'C': return 15    // Event card
    case 'C1': return 20   // Tier 1 character
    case 'C2': return 30   // Tier 2 character
    case 'C3': return 40   // Tier 3 character
    case 'C4': return 100  // Special character (requires grid clear)
    default: return 0
  }
}

// Check if character tier is available
export function isCharacterTierAvailable(tier: string, gameState: GameState): boolean {
  if (tier === 'C4') {
    return gameState.gridCleared
  }
  return gameState.unlockedTiers.includes(tier)
}

// Movement validation
export function isValidMove(from: GridTile, to: GridTile): boolean {
  // Can only move to adjacent tiles (including diagonals)
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)
}

// Get current player position
export function getPlayerPosition(tilemap: GridTile[]): GridTile | undefined {
  return tilemap.find(tile => tile.type === 'P')
}

// Update player position
export function movePlayer(tilemap: GridTile[], fromId: number, toId: number): GridTile[] {
  return tilemap.map(tile => {
    if (tile.id === fromId) {
      return { ...tile, type: tile.type === 'P' ? 'G' : tile.type, discovered: true }
    }
    if (tile.id === toId) {
      return { ...tile, type: 'P', discovered: true }
    }
    return tile
  })
}

// Initial grid layout - used to initialize new games
export const INITIAL_GRID_LAYOUT: GridTile[] = [
  { id: 1, type: 'G', x: 0, y: 0, discovered: false },
  { id: 2, type: 'G', x: 1, y: 0, discovered: false },
  { id: 3, type: 'G', x: 2, y: 0, discovered: false },
  { id: 4, type: 'C', x: 3, y: 0, discovered: false },
  { id: 5, type: 'C', x: 4, y: 0, discovered: false },
  { id: 6, type: 'C', x: 5, y: 0, discovered: false },
  { id: 7, type: 'G', x: 0, y: 1, discovered: false },
  { id: 8, type: 'G', x: 1, y: 1, discovered: false },
  { id: 9, type: 'C1', x: 2, y: 1, discovered: false },
  { id: 10, type: 'G', x: 3, y: 1, discovered: false },
  { id: 11, type: 'C2', x: 4, y: 1, discovered: false },
  { id: 12, type: 'G', x: 5, y: 1, discovered: false },
  { id: 13, type: 'P', x: 0, y: 2, discovered: true },  // Player starting position
  { id: 14, type: 'G', x: 1, y: 2, discovered: false },
  { id: 15, type: 'C3', x: 2, y: 2, discovered: false },
  { id: 16, type: 'G', x: 3, y: 2, discovered: false },
  { id: 17, type: 'C4', x: 4, y: 2, discovered: false },
  { id: 18, type: 'G', x: 5, y: 2, discovered: false },
  { id: 19, type: 'G', x: 0, y: 3, discovered: false },
  { id: 20, type: 'G', x: 1, y: 3, discovered: false },
  { id: 21, type: 'C1', x: 2, y: 3, discovered: false },
  { id: 22, type: 'G', x: 3, y: 3, discovered: false },
  { id: 23, type: 'C2', x: 4, y: 3, discovered: false },
  { id: 24, type: 'C3', x: 5, y: 3, discovered: false },
  { id: 25, type: 'C4', x: 0, y: 4, discovered: false },
  { id: 26, type: 'G', x: 1, y: 4, discovered: false }
]

export interface NewPlayer {
  userid: string
  email: string
  initial_gold?: number    // Default to 50
  welcome_pulls?: number   // Default to 3
}

export interface PullResult {
  success: boolean
  characterId?: number
  character?: Character
  error?: string
  tier?: string           // Track which tier was pulled
}

export type NewUserCollection = {
  userid: string
  characterid: number
  customName?: string | null
  favorite: boolean
}

// Response Types
export interface DiscoverTileResponse {
  success: boolean
  reward?: number
  character?: Character
  eventContent?: string
  updatedTilemap: GridTile[]
  unlockedTier?: string    // Indicate if a new tier was unlocked
  gridCleared?: boolean    // Indicate if grid was cleared
}

export interface NewGameResponse {
  success: boolean
  gameState: GameState
} 