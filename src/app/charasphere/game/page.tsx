'use client'

import React, { useState, Suspense } from 'react'
import { Character } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { useGameState } from '@/hooks/useGameState'
import { PlayerStats } from '@/components/PlayerStats'
import { GridTile, TileType } from '@/types/game'
import { toast } from 'react-hot-toast'

// Simplified tile interface
interface UITile extends GridTile {
  revealed: boolean;
  discovered: boolean;
  value: number;
  tileType: string;
  character?: Character;
}

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const characterId = searchParams.get('character')

  // Core game state from hook
  const { 
    gameState, 
    playerStats,
    loading: gameLoading, 
    error: gameError, 
    movePlayer,
    discoverTile,
    updateGameState 
  } = useGameState()

  // Minimal UI state
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  // Handle tile click with simplified logic
  const handleTileClick = async (x: number, y: number) => {
    if (gameLoading || !gameState || !playerStats?.moves) {
      toast.error('Cannot move right now')
      return
    }

    const tileId = y * 5 + x + 1
    
    // Check if tile is adjacent
    const playerX = (gameState.playerPosition - 1) % 5
    const playerY = Math.floor((gameState.playerPosition - 1) / 5)
    const dx = Math.abs(x - playerX)
    const dy = Math.abs(y - playerY)
    
    if (dx > 1 || dy > 1) {
      toast.error('Can only move to adjacent tiles')
      return
    }

    setSelectedTile({x, y})
    setShowAnimation(true)

    try {
      await movePlayer(tileId)
      const result = await discoverTile(tileId)
      
      if (result?.success) {
        if (result.reward) {
          toast.success(`Found ${result.reward} gold!`)
        }
      }
    } catch (err) {
      console.error('Error moving:', err)
      toast.error('Failed to move')
    } finally {
      setShowAnimation(false)
      setSelectedTile(null)
    }
  }

  // Loading state
  if (gameLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="mt-4 text-gray-400">Loading game...</p>
      </div>
    )
  }

  // Error state
  if (gameError) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <p className="text-red-500">{gameError}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <PlayerStats className="mb-4" />

      {/* Game Grid */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {gameState?.tilemap.map((tile, index) => {
          const x = index % 5
          const y = Math.floor(index / 5)
          const isSelected = selectedTile?.x === x && selectedTile?.y === y
          const isPlayerTile = gameState.playerPosition === tile.id

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(x, y)}
              disabled={gameLoading}
              className={`
                w-20 h-20 rounded-lg transition-all
                ${isPlayerTile ? 'bg-blue-500' : 'bg-gray-200'}
                ${isSelected ? 'ring-2 ring-yellow-400' : ''}
                ${showAnimation && isSelected ? 'animate-pulse' : ''}
              `}
            >
              {tile.type === 'P' && '👤'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <GameContent />
      </Suspense>
    </ErrorBoundary>
  )
} 