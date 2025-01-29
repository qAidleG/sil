'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { Roster } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { useGameState } from '@/hooks/useGameState'
import { PlayerStats } from '@/components/PlayerStats'
import { GridTile, TileType } from '@/types/game'
import { toast } from 'react-hot-toast'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'

// Simplified tile interface
interface UITile extends GridTile {
  revealed: boolean;
  discovered: boolean;
  value: number;
  tileType: string;
  character?: Roster;
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
        <p className="text-red-500">{getErrorMessage(gameError)}</p>
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

const CARD_COST = 1  // Cost in moves to start a game

export default function GamePage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkPlayerStats = async () => {
      if (!user?.id) return

      try {
        // Check if player has any cards
        const { data: stats, error } = await supabase
          .from('playerstats')
          .select('cards')
          .eq('userid', user.id)
          .single()

        if (error) throw error

        // Check if player has cards available
        if (!stats.cards) {
          toast.error('You need at least one card to start a game! Claim your starter pack first.')
          router.push('/charasphere')
          return
        }

        // Use up one card for the game
        const { error: updateError } = await supabase
          .from('playerstats')
          .update({ cards: stats.cards - 1 })
          .eq('userid', user.id)

        if (updateError) throw updateError

        toast.success('Card used to start game!')
        // Initialize game state here...
        
      } catch (err) {
        console.error('Error checking player stats:', err)
        setError('Failed to start game')
        router.push('/charasphere')
      } finally {
        setLoading(false)
      }
    }

    checkPlayerStats()
  }, [user?.id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <GameContent />
      </Suspense>
    </ErrorBoundary>
  )
} 