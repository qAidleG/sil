'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { Character } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Loader2, X } from 'lucide-react'
import { soundManager } from '@/lib/sounds'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

interface GridPosition {
  x: number
  y: number
}

type TileType = 'event' | 'high-value' | 'low-value'

interface CardState {
  revealed: boolean
  character: Character | null
  tileType: TileType
  value: number
  eventSeen?: boolean
}

interface EventDialogState {
  isOpen: boolean
  dialog: string | null
  reward: number
}

const createEmptyGrid = (): CardState[][] => 
  Array(5).fill(null).map(() => 
    Array(5).fill(null).map(() => ({ 
      revealed: false, 
      character: null,
      tileType: 'low-value',
      value: 1
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
  const [moves, setMoves] = useState(30)
  const [gold, setGold] = useState(0)
  const [undiscoveredCount, setUndiscoveredCount] = useState(25)
  const [lastMoveRefresh, setLastMoveRefresh] = useState<Date>(new Date())
  const [eventDialog, setEventDialog] = useState<EventDialogState>({
    isOpen: false,
    dialog: null,
    reward: 0
  })
  const [moveRefreshProgress, setMoveRefreshProgress] = useState(0)
  const [errorType, setErrorType] = useState<'load' | 'save' | 'network' | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const loadUserStats = async () => {
    try {
      const { data: userStats, error } = await supabase
        .from('UserStats')
        .select('*')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newStats, error: createError } = await supabase
            .from('UserStats')
            .insert([{
              moves: 30,
              gold: 0,
              lastMoveRefresh: new Date().toISOString()
            }])
            .select()
            .single()

          if (createError) throw createError
          if (newStats) {
            setMoves(newStats.moves)
            setGold(newStats.gold)
            setLastMoveRefresh(new Date(newStats.lastMoveRefresh))
          }
        } else {
          throw error
        }
      } else if (userStats) {
        setMoves(userStats.moves)
        setGold(userStats.gold)
        setLastMoveRefresh(new Date(userStats.lastMoveRefresh))
      }
    } catch (err) {
      handleError(err, 'network')
    }
  }

  const handleError = (err: any, type: 'load' | 'save' | 'network') => {
    console.error(`Error (${type}):`, err)
    setErrorType(type)
    if (err instanceof Error) {
      setError(err.message)
    } else if (typeof err === 'string') {
      setError(err)
    } else {
      setError('An unexpected error occurred')
    }
  }

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

  // Load user stats
  useEffect(() => {
    loadUserStats()
  }, [])

  // Update move refresh timer
  useEffect(() => {
    const checkMoveRefresh = async () => {
      const now = new Date()
      const timeSinceRefresh = now.getTime() - lastMoveRefresh.getTime()
      const progress = Math.min((timeSinceRefresh / 60000) * 100, 100)
      setMoveRefreshProgress(progress)
      
      if (timeSinceRefresh >= 60000 && moves < 30) {
        const newMoves = Math.min(moves + 10, 30)
        try {
          const { error } = await supabase
            .from('UserStats')
            .update({
              moves: newMoves,
              lastMoveRefresh: now.toISOString()
            })

          if (error) throw error

          setMoves(newMoves)
          setLastMoveRefresh(now)
          setMoveRefreshProgress(0)
        } catch (err) {
          console.error('Error refreshing moves:', err)
        }
      }
    }

    const timer = setInterval(checkMoveRefresh, 1000) // Update progress more frequently
    return () => clearInterval(timer)
  }, [moves, lastMoveRefresh])

  const retryOperation = async () => {
    setError(null)
    setErrorType(null)
    
    switch (errorType) {
      case 'load':
        await fetchCharacter(parseInt(characterId || ''))
        break
      case 'save':
        if (grid && selectedCharacter) {
          await saveGridProgress(grid, gold)
        }
        break
      case 'network':
        // Retry last failed operation
        await loadUserStats()
        break
    }
  }

  // Save grid progress
  const saveGridProgress = useCallback(async (newGrid: CardState[][], newGold: number) => {
    try {
      const discoveredTiles = newGrid.flatMap((row, y) => 
        row.map((cell, x) => ({
          x,
          y,
          revealed: cell.revealed,
          tileType: cell.tileType,
          value: cell.value,
          eventSeen: cell.eventSeen
        }))
      ).filter(tile => tile.revealed)

      const { error } = await supabase
        .from('GridProgress')
        .upsert({
          characterId: parseInt(characterId || ''),
          discoveredTiles: JSON.stringify(discoveredTiles),
          goldCollected: newGold
        })

      if (error) throw error

      // Update UserStats gold
      const { error: statsError } = await supabase
        .from('UserStats')
        .update({ gold: newGold })

      if (statsError) throw statsError
    } catch (err) {
      handleError(err, 'save')
    }
  }, [characterId, handleError])

  // Function to generate random grid with events and rewards
  const generateGameGrid = (character: Character): CardState[][] => {
    const newGrid = createEmptyGrid()
    const positions: GridPosition[] = []
    
    // Generate all possible positions
    for(let y = 0; y < 5; y++) {
      for(let x = 0; x < 5; x++) {
        if(!(x === 2 && y === 2)) { // Exclude center starting position
          positions.push({ x, y })
        }
      }
    }

    // Shuffle positions
    for(let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    // Place 3 events
    for(let i = 0; i < 3; i++) {
      const pos = positions[i]
      newGrid[pos.y][pos.x].tileType = 'event'
      newGrid[pos.y][pos.x].value = Math.floor(Math.random() * 6) // 0-5 gold (d6 roll)
    }

    // Place 7 high-value rewards
    for(let i = 3; i < 10; i++) {
      const pos = positions[i]
      newGrid[pos.y][pos.x].tileType = 'high-value'
      newGrid[pos.y][pos.x].value = 3
    }

    // Rest are already low-value (1g) from createEmptyGrid

    // Place character at center
    newGrid[2][2] = {
      revealed: true,
      character: character,
      tileType: 'low-value',
      value: 0
    }

    return newGrid
  }

  // Update fetchCharacter to load saved progress
  const fetchCharacter = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch character and grid progress in parallel
      const [characterResponse, progressResponse] = await Promise.all([
        supabase
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
          .single(),
        supabase
          .from('GridProgress')
          .select('*')
          .eq('characterId', id)
          .single()
      ])

      if (characterResponse.error) throw characterResponse.error

      if (characterResponse.data) {
        setSelectedCharacter(characterResponse.data)
        let newGrid: CardState[][]

        if (!progressResponse.error && progressResponse.data) {
          // Load saved progress
          newGrid = generateGameGrid(characterResponse.data)
          const savedTiles = JSON.parse(progressResponse.data.discoveredTiles)
          let undiscovered = 24 // Start with all tiles undiscovered except starting position

          savedTiles.forEach((tile: any) => {
            if (newGrid[tile.y][tile.x].tileType === tile.tileType) {
              newGrid[tile.y][tile.x].revealed = true
              newGrid[tile.y][tile.x].eventSeen = tile.eventSeen
              undiscovered--
            }
          })

          setUndiscoveredCount(undiscovered)
        } else {
          // Generate new grid
          newGrid = generateGameGrid(characterResponse.data)
          setUndiscoveredCount(24)
        }

        setGrid(newGrid)
      }
    } catch (err) {
      handleError(err, 'load')
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

  // Update handleMove to save progress
  const handleMove = async (x: number, y: number) => {
    if (!canMoveTo(x, y) || moves <= 0) return

    soundManager.play('move')
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    const targetCell = newGrid[y][x]
    
    if (selectedCharacter) {
      if (!targetCell.revealed) {
        const newGold = gold + targetCell.value
        setGold(newGold)
        setUndiscoveredCount(prev => prev - 1)
        
        if (targetCell.tileType === 'event' && selectedCharacter.dialogs?.length > 0) {
          targetCell.eventSeen = true
          // Pick random dialog
          const randomDialog = selectedCharacter.dialogs[
            Math.floor(Math.random() * selectedCharacter.dialogs.length)
          ]
          setEventDialog({
            isOpen: true,
            dialog: randomDialog,
            reward: targetCell.value
          })
        }

        await saveGridProgress(newGrid, newGold)
      }

      newGrid[y][x] = {
        ...targetCell,
        revealed: true,
        character: selectedCharacter
      }

      newGrid[playerPosition.y][playerPosition.x] = {
        ...newGrid[playerPosition.y][playerPosition.x],
        revealed: true,
        character: null
      }
    }
    
    setGrid(newGrid)
    setPlayerPosition({ x, y })

    const newMoves = moves - 1
    setMoves(newMoves)
    try {
      const { error } = await supabase
        .from('UserStats')
        .update({ moves: newMoves })

      if (error) throw error
    } catch (err) {
      console.error('Error updating moves:', err)
    }
  }

  // Update handleReset to reset progress
  const handleReset = async () => {
    soundManager.play('reset')
    if (selectedCharacter) {
      const newGrid = generateGameGrid(selectedCharacter)
      setGrid(newGrid)
      setPlayerPosition({ x: 2, y: 2 })
      setUndiscoveredCount(24)
      setGold(0)
      setMoves(30)

      try {
        // Reset grid progress
        const { error: gridError } = await supabase
          .from('GridProgress')
          .delete()
          .eq('characterId', characterId)

        if (gridError) throw gridError

        // Reset user stats
        const { error: statsError } = await supabase
          .from('UserStats')
          .update({
            moves: 30,
            gold: 0,
            lastMoveRefresh: new Date().toISOString()
          })

        if (statsError) throw statsError
      } catch (err) {
        console.error('Error resetting progress:', err)
        setError('Failed to reset progress')
      }
    }
  }

  const toggleMute = () => {
    const newMuted = soundManager.toggleMute()
    setIsMuted(newMuted)
  }

  // Add image cycling function
  const cycleCharacterImage = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering move
    const images = selectedCharacter?.GeneratedImage
    if (images && images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
      soundManager.play('flip')
    }
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
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400 text-lg font-semibold">{error}</p>
          
          {errorType === 'network' && (
            <p className="text-gray-400 text-sm">
              Please check your internet connection and try again.
            </p>
          )}
          
          {errorType === 'save' && (
            <p className="text-gray-400 text-sm">
              Your progress couldn't be saved. You can continue playing,
              but your progress might not be preserved.
            </p>
          )}
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={retryOperation}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
            >
              Try Again
            </button>
            
            {errorType === 'save' && (
              <button
                onClick={() => {
                  setError(null)
                  setErrorType(null)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                Continue Anyway
              </button>
            )}
            
            <button
              onClick={() => router.push('/charasphere')}
              className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
            >
              Exit Game
            </button>
          </div>
        </div>
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
        
        {/* Game Stats */}
        <div className="mt-4 flex justify-center space-x-8">
          <div className="text-center relative">
            <p className="text-sm text-gray-400">Moves</p>
            <p className="text-xl font-bold text-white">{moves}</p>
            {moves < 30 && (
              <div className="mt-1 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  animate={{
                    width: `${moveRefreshProgress}%`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
            {moves < 30 && moveRefreshProgress > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                +10 in {Math.ceil(60 - (moveRefreshProgress * 0.6))}s
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Gold</p>
            <p className="text-xl font-bold text-yellow-400">{gold}g</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Undiscovered</p>
            <p className="text-xl font-bold text-purple-400">{undiscoveredCount}</p>
          </div>
        </div>

        <div className="text-gray-400 mt-4 space-y-2">
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
                  disabled={!canMoveTo(x, y) || moves <= 0}
                  whileHover={canMoveTo(x, y) && moves > 0 ? { 
                    scale: 1.05,
                    transition: { duration: soundManager.durations.hover }
                  } : {}}
                  onHoverStart={() => canMoveTo(x, y) && moves > 0 && soundManager.play('hover')}
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
                    ${canMoveTo(x, y) && moves > 0
                      ? 'border-blue-500/50 hover:border-blue-400 cursor-pointer shadow-lg hover:shadow-blue-500/20' 
                      : 'border-gray-700 cursor-not-allowed'}
                    ${playerPosition.x === x && playerPosition.y === y
                      ? 'bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : cell.revealed 
                        ? cell.tileType === 'event'
                          ? 'bg-purple-900/50'
                          : cell.tileType === 'high-value'
                            ? 'bg-yellow-900/50'
                            : 'bg-gray-800/50'
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
                        className="w-full h-full p-2 relative group"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: soundManager.durations.flip / 2, delay: soundManager.durations.flip / 2 }}
                      >
                        {cell.character.GeneratedImage?.[currentImageIndex]?.url ? (
                          <>
                            <img
                              src={cell.character.GeneratedImage[currentImageIndex].url}
                              alt={cell.character.name}
                              className="w-full h-full object-cover rounded-md"
                              onClick={cycleCharacterImage}
                            />
                            {cell.character.GeneratedImage.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to cycle images ({currentImageIndex + 1}/{cell.character.GeneratedImage.length})
                              </div>
                            )}
                          </>
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
                        {cell.tileType === 'event' ? (
                          <div className="text-purple-400 font-bold">{cell.value}g</div>
                        ) : cell.tileType === 'high-value' ? (
                          <div className="text-yellow-400 font-bold">{cell.value}g</div>
                        ) : (
                          <div className="text-gray-400 font-bold">{cell.value}g</div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: soundManager.durations.flip / 2 }}
                      >
                        <div className={`w-12 h-12 rounded-full bg-blue-500/20 animate-pulse`} />
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

      {/* Event Dialog Modal */}
      <AnimatePresence>
        {eventDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEventDialog(prev => ({ ...prev, isOpen: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800/90 rounded-xl p-6 max-w-lg w-full space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-blue-400">
                  Event Encounter!
                </h3>
                <button
                  onClick={() => setEventDialog(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {selectedCharacter?.GeneratedImage?.[0]?.url && (
                  <img
                    src={selectedCharacter.GeneratedImage[0].url}
                    alt={selectedCharacter.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {selectedCharacter?.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {selectedCharacter?.Series?.name}
                  </p>
                </div>
              </div>

              <p className="text-gray-300 italic">
                "{eventDialog.dialog}"
              </p>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-yellow-400 font-bold">
                  Received {eventDialog.reward} gold!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="mt-4 text-gray-400">Loading game...</p>
        </div>
      }>
        <GameContent />
      </Suspense>
    </ErrorBoundary>
  )
} 