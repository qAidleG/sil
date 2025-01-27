import { Character } from './database'

// Grid Types
export type GoldTileType = 'G1' | 'G2' | 'G3'  // Different gold values
export type EventTileType = 'E1' | 'E2' | 'E3'  // Event tiles
export type CharacterTileType = 'C1' | 'C2' | 'C3' | 'C4'  // Character tiles
export type TileType = GoldTileType | EventTileType | CharacterTileType | 'P'  // All tile types

export interface GridTile {
  id: number
  type: TileType
  x: number
  y: number
  characterId?: number    // ID of the unclaimed character assigned to this tile
  character?: Character   // Character data if loaded
  discovered: boolean     // Track if tile has been visited
}

// Game State
export interface GameState {
  userId: string
  tilemap: GridTile[]
  gold: number
  goldCollected: number
  turns: number
  gridCleared: boolean     // Track if entire grid is discovered
  playerPosition: number   // Current position of player
  isCompleting?: boolean   // Flag for completion animation
}

// Reward Calculation
export function calculateGoldReward(tile: GridTile): number {
  const rollD3 = () => Math.floor(Math.random() * 3) + 1  // 1-3
  
  switch (tile.type) {
    case 'G1': return rollD3() + 3        // 4-6 gold
    case 'G2': return (rollD3() + rollD3()) + 3  // 5-9 gold
    case 'G3': return (rollD3() + rollD3() + rollD3()) + 3  // 6-12 gold
    case 'E1':
    case 'E2':
    case 'E3':
      return 10  // Event tiles give fixed reward
    case 'C1':
    case 'C2':
    case 'C3':
    case 'C4':
      return 20  // Character tiles give fixed reward
    default: return 0
  }
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
      // When leaving a tile, convert it to the appropriate gold tile based on position
      const y = Math.floor((tile.y + 1) / 2)  // Convert y position to gold tier
      return { ...tile, type: `G${y}` as TileType, discovered: true }
    }
    if (tile.id === toId) {
      return { ...tile, type: 'P' as TileType, discovered: true }
    }
    return tile
  })
}

// Generate randomized grid layout
function generateRandomGridLayout(): GridTile[] {
  // Create array of all possible tiles (excluding player position)
  const tiles: TileType[] = [
    'G1', 'G1', 'G1', 'G1', 'G1', 'G1',  // 6 G1 tiles
    'G2', 'G2', 'G2', 'G2', 'G2', 'G2',  // 6 G2 tiles
    'G3', 'G3', 'G3', 'G3', 'G3', 'G3',  // 6 G3 tiles
    'E1', 'E2', 'E3',  // 3 event tiles
    'C1', 'C2', 'C3', 'C4'  // 4 character tiles
  ]

  // Shuffle the tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Create the grid with shuffled tiles
  const grid: GridTile[] = [];
  let tileIndex = 0;
  
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 6; x++) {
      // Skip middle position (0,2) for player
      if (x === 0 && y === 2) {
        grid.push({
          id: grid.length + 1,
          type: 'P',
          x,
          y,
          discovered: true
        });
      } else if (tileIndex < tiles.length) {
        grid.push({
          id: grid.length + 1,
          type: tiles[tileIndex],
          x,
          y,
          discovered: false
        });
        tileIndex++;
      }
    }
  }

  return grid;
}

// Replace static INITIAL_GRID_LAYOUT with function call
export const INITIAL_GRID_LAYOUT = generateRandomGridLayout();

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
  gridCleared?: boolean    // Indicate if grid was cleared
}

export interface NewGameResponse {
  success: boolean
  gameState: GameState
} 