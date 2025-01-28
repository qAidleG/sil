import { useState, useEffect } from 'react'
import { useUser } from './useUser'
import { GameState, GridTile, TileType } from '@/types/game'
import { useRouter } from 'next/navigation'

interface PlayerStats {
  moves: number;
  gold: number;
}

const MOVE_COST = 1  // Cost in turns to move to a new tile

export function useGameState() {
  const { user } = useUser()
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

  // Check if board is completed
  const checkBoardCompletion = (tilemap: GridTile[]) => {
    // Board is complete if all tiles except current position are claimed ('C')
    return tilemap.every(tile => tile.type === 'C' || tile.type === 'P')
  }

  // Load player stats
  const loadPlayerStats = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/player-stats?userId=${user.id}`)
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setPlayerStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load stats')
    }
  }

  // Load game state
  const loadGame = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/game-state?userId=${user.id}`)
      if (!response.ok) throw new Error('Failed to load game')
      
      const data = await response.json()
      setGameState(data.gameState)
      setPlayerStats(data.stats)
      setError(null)

      // Check if board is already complete
      if (data.gameState && checkBoardCompletion(data.gameState.tilemap)) {
        showCompletionAnimation()
      }
    } catch (err) {
      console.error('Error loading game:', err)
      setError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  // Save game state
  const saveGame = async () => {
    if (!user?.id || !gameState) return

    try {
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          gameState
        })
      })

      if (!response.ok) throw new Error('Failed to save game')
      setError(null)

      // Check if board is complete after saving
      if (checkBoardCompletion(gameState.tilemap)) {
        showCompletionAnimation()
      }
    } catch (err) {
      console.error('Error saving game:', err)
      setError('Failed to save game')
    }
  }

  // Save and exit to charasphere
  const saveAndExit = async () => {
    await saveGame()
    router.push('/charasphere')
  }

  // Show completion animation and redirect
  const showCompletionAnimation = async () => {
    // Set a flag to show animation in the UI
    setGameState(prev => prev ? { ...prev, isCompleting: true } : null)
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Redirect
    router.push('/charasphere')
  }

  // Reset game
  const resetGame = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/game-state?userId=${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to reset game')
      
      // Reload game state after reset
      await loadGame()
      setError(null)
    } catch (err) {
      console.error('Error resetting game:', err)
      setError('Failed to reset game')
    }
  }

  // Discover a tile
  const discoverTile = async (tileId: number) => {
    if (!user?.id || !gameState) return

    try {
      const response = await fetch('/api/discover-tile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tileId,
          currentTilemap: gameState.tilemap
        })
      })

      if (!response.ok) throw new Error('Failed to discover tile')
      
      const result = await response.json()
      if (result.success) {
        setGameState(prev => prev ? {
          ...prev,
          tilemap: result.updatedTilemap,
          goldCollected: prev.goldCollected + (result.reward || 0)
        } : null)
      }
      
      return result
    } catch (err) {
      console.error('Error discovering tile:', err)
      setError('Failed to discover tile')
      return null
    }
  }

  // Move player
  const movePlayer = async (newPosition: number) => {
    if (!gameState || !playerStats) return
    
    // Check if player has enough turns
    if (playerStats.moves < MOVE_COST) {
      setError('Not enough turns! Wait for turns to regenerate.')
      return
    }

    // Update moves first
    try {
      const response = await fetch('/api/use-moves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          moves: MOVE_COST
        })
      })

      if (!response.ok) throw new Error('Failed to use turns')
      
      const { remainingMoves } = await response.json()
      setPlayerStats(prev => prev ? { ...prev, moves: remainingMoves } : null)

      // Update game state
      const updatedTilemap = gameState.tilemap.map((tile: GridTile) => {
        if (tile.id === gameState.playerPosition) {
          // Mark the tile as claimed when player leaves it
          return { ...tile, type: 'C' as TileType, discovered: true }
        }
        if (tile.id === newPosition) {
          return { ...tile, type: 'P' as TileType, discovered: true }
        }
        return tile
      })

      setGameState(prev => prev ? {
        ...prev,
        tilemap: updatedTilemap,
        playerPosition: newPosition
      } : null)

      // Check board completion after move
      if (checkBoardCompletion(updatedTilemap)) {
        await saveGame()  // Save before showing completion
        showCompletionAnimation()  // Show completion animation
      }
    } catch (err) {
      console.error('Error moving player:', err)
      setError('Failed to move player')
    }
  }

  // Load game on mount and when user changes
  useEffect(() => {
    loadGame()
    loadPlayerStats()
  }, [user?.id])

  return {
    gameState,
    playerStats,
    loading,
    error,
    saveGame,
    saveAndExit,
    resetGame,
    discoverTile,
    movePlayer,
    updateGameState: (newState: GameState) => {
      setGameState(newState);
      // Update player stats if needed
      if (newState.goldCollected !== gameState?.goldCollected) {
        setPlayerStats(prev => prev ? {
          ...prev,
          gold: (prev.gold || 0) + (newState.goldCollected - (gameState?.goldCollected || 0))
        } : null);
      }
    }
  }
} 