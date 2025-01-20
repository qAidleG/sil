'use client'

import React, { useState, useEffect } from 'react'
import { Character } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { soundManager } from '@/lib/sounds'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

interface GridPosition {
  x: number
  y: number
}

interface CardState {
  revealed: boolean
  character: Character | null
}

const createEmptyGrid = (): CardState[][] => 
  Array(5).fill(null).map(() => 
    Array(5).fill(null).map(() => ({ 
      revealed: false, 
      character: null 
    }))
  )

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const characterId = searchParams.get('character')
  
  const [playerPosition, setPlayerPosition] = useState<GridPosition>({ x: 2, y: 2 })
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [grid, setGrid] = useState<CardState[][]>(createEmptyGrid())
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp':
          handleMove(playerPosition.x, playerPosition.y - 1)
          break
        case 'ArrowDown':
          handleMove(playerPosition.x, playerPosition.y + 1)
          break
        case 'ArrowLeft':
          handleMove(playerPosition.x - 1, playerPosition.y)
          break
        case 'ArrowRight':
          handleMove(playerPosition.x + 1, playerPosition.y)
          break
        case 'r':
        case 'R':
          handleReset()
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        case 'Escape':
          router.push('/charasphere')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [playerPosition, router])

  // Fetch selected character
  useEffect(() => {
    if (characterId) {
      fetchCharacter(parseInt(characterId))
    }
  }, [characterId])

  // Add touch event handling
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    const minSwipeDistance = 30 // minimum distance for a swipe

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Only handle if it's a clear horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) >= minSwipeDistance) {
          if (deltaX > 0) {
            handleMove(playerPosition.x + 1, playerPosition.y)
          } else {
            handleMove(playerPosition.x - 1, playerPosition.y)
          }
        }
      } else {
        if (Math.abs(deltaY) >= minSwipeDistance) {
          if (deltaY > 0) {
            handleMove(playerPosition.x, playerPosition.y + 1)
          } else {
            handleMove(playerPosition.x, playerPosition.y - 1)
          }
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [playerPosition])

  const fetchCharacter = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('Character')
        .select(`
          *,
          Series (
            name,
            universe
          ),
          GeneratedImage (
            url
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setSelectedCharacter(data)
        // Place character at player position
        const newGrid = createEmptyGrid()
        newGrid[playerPosition.y][playerPosition.x] = {
          revealed: true,
          character: data
        }
        setGrid(newGrid)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load character')
      console.error('Error fetching character:', err)
    } finally {
      setLoading(false)
    }
  }

  const canMoveTo = (x: number, y: number): boolean => {
    // Check if position is within grid bounds
    if (x < 0 || x >= 5 || y < 0 || y >= 5) return false
    
    // Check if position is adjacent to current position
    const dx = Math.abs(x - playerPosition.x)
    const dy = Math.abs(y - playerPosition.y)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
  }

  const handleMove = (x: number, y: number) => {
    if (!canMoveTo(x, y)) return

    // Play move sound
    soundManager.play('move')

    // Update grid with animation timing
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    
    // Move character to new position
    if (selectedCharacter) {
      newGrid[y][x] = {
        revealed: true,
        character: selectedCharacter
      }
      // Clear old position
      newGrid[playerPosition.y][playerPosition.x] = {
        revealed: true,
        character: null
      }
    }
    
    setGrid(newGrid)
    setPlayerPosition({ x, y })
  }

  const handleReset = () => {
    soundManager.play('reset')
    const newGrid = createEmptyGrid()
    if (selectedCharacter) {
      newGrid[2][2] = {
        revealed: true,
        character: selectedCharacter
      }
    }
    setGrid(newGrid)
    setPlayerPosition({ x: 2, y: 2 })
  }

  const toggleMute = () => {
    const newMuted = soundManager.toggleMute()
    setIsMuted(newMuted)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="mt-4 text-gray-400">Loading game...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => fetchCharacter(parseInt(characterId || ''))}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!selectedCharacter) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-400">Select a character from your collection to start</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Game Header */}
      <div className="mb-8 text-center relative">
        <button
          onClick={toggleMute}
          className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <h2 className="text-2xl font-bold text-blue-400">
          Playing as {selectedCharacter?.name}
        </h2>
        <div className="text-gray-400 mt-2 space-y-2">
          <p>Click adjacent cards or use arrow keys to move</p>
          <div className="text-sm opacity-60">
            <p>Keyboard Controls:</p>
            <p>Arrow Keys - Move • R - Reset • M - Mute • Esc - Exit</p>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div 
        className="grid grid-cols-5 gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 touch-none"
        role="grid"
        aria-label="Game Grid"
      >
        <AnimatePresence>
          {grid.map((row, y) => (
            <React.Fragment key={y}>
              {row.map((cell, x) => (
                <motion.button
                  key={`${x}-${y}`}
                  onClick={() => handleMove(x, y)}
                  disabled={!canMoveTo(x, y)}
                  whileHover={canMoveTo(x, y) ? { 
                    scale: 1.05,
                    transition: { duration: soundManager.durations.hover }
                  } : {}}
                  onHoverStart={() => canMoveTo(x, y) && soundManager.play('hover')}
                  animate={{
                    rotateY: cell.revealed ? 0 : 180,
                    transition: { 
                      duration: soundManager.durations.flip,
                      type: "spring",
                      stiffness: 100
                    }
                  }}
                  onAnimationComplete={() => {
                    if (cell.revealed) soundManager.play('flip')
                  }}
                  className={`
                    aspect-[2.5/3.5] rounded-lg border transition-all
                    ${canMoveTo(x, y) 
                      ? 'border-blue-500/50 hover:border-blue-400 cursor-pointer shadow-lg hover:shadow-blue-500/20' 
                      : 'border-gray-700 cursor-not-allowed'}
                    ${playerPosition.x === x && playerPosition.y === y
                      ? 'bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : cell.revealed 
                        ? 'bg-gray-800/50'
                        : 'bg-gradient-to-br from-gray-700/50 to-gray-900/50'}
                    ${!cell.revealed && 'hover:border-gray-600'}
                    perspective-1000
                  `}
                >
                  <motion.div 
                    className="w-full h-full"
                    animate={{
                      rotateY: cell.revealed ? 0 : 180,
                      transition: { 
                        duration: soundManager.durations.flip,
                        type: "spring",
                        stiffness: 100
                      }
                    }}
                  >
                    {cell.character ? (
                      <motion.div 
                        className="w-full h-full p-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: soundManager.durations.flip / 2, delay: soundManager.durations.flip / 2 }}
                      >
                        {cell.character.GeneratedImage?.[0]?.url ? (
                          <img
                            src={cell.character.GeneratedImage[0].url}
                            alt={cell.character.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No Image
                          </div>
                        )}
                      </motion.div>
                    ) : cell.revealed ? (
                      <motion.div 
                        className="w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: soundManager.durations.flip / 2 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-700/50" />
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: soundManager.durations.flip / 2 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 animate-pulse" />
                      </motion.div>
                    )}
                  </motion.div>
                </motion.button>
              ))}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Controls */}
      <motion.div 
        className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: soundManager.durations.reset }}
      >
        <button
          onClick={() => router.push('/charasphere')}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-300"
        >
          Exit Game
        </button>
        <button
          onClick={handleReset}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
        >
          Reset Game
        </button>
      </motion.div>
    </div>
  )
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <GameContent />
    </ErrorBoundary>
  )
} 