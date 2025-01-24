'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { Character } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Loader2, X, ChevronLeft, ChevronRight, Save, Trophy } from 'lucide-react'
import { soundManager } from '@/lib/sounds'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { useGameState } from '@/hooks/useGameState'
import { PlayerStats } from '@/components/PlayerStats'
import { Button } from '@/components/ui/button'

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

interface SwitchDialogState {
  isOpen: boolean
  outgoingDialog?: string
  incomingDialog?: string
  outgoingCharacter?: Character
  incomingCharacter?: Character
}

// Simplify ability interface
interface SeriesAbility {
  name: string
  description: string
  cost: number
}

// Single default ability
const DEFAULT_ABILITY: SeriesAbility = {
  name: 'Special Move',
  description: 'Gain 1-3 bonus gold (costs 5 moves)',
  cost: 5
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
  const [showSwitchPanel, setShowSwitchPanel] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([])
  const [switchLoading, setSwitchLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [switchDialog, setSwitchDialog] = useState<SwitchDialogState>({
    isOpen: false
  })
  const [selectedAbility, setSelectedAbility] = useState<SeriesAbility | null>(null)

  // Add development mode check
  const isDevelopment = process.env.NODE_ENV === 'development'

  const { gameState, playerStats, loading: gameLoading, error: gameError, movePlayer, saveAndExit } = useGameState()

  const loadUserStats = async () => {
    try {
      const response = await fetch(`/api/game-state?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to load game state');
      }
      
      const stats = await response.json();
      setMoves(stats.moves);
      setGold(stats.gold);
      setLastMoveRefresh(new Date(stats.last_move_refresh));

      // Load or initialize grid
      if (stats.grid && stats.grid.length > 0) {
        // Convert flat grid back to 2D array
        const newGrid = createEmptyGrid();
        stats.grid.forEach((tile: any) => {
          newGrid[tile.y][tile.x] = {
            revealed: tile.revealed,
            tileType: tile.tileType,
            value: tile.value,
            eventSeen: tile.eventSeen,
            character: null
          };
        });
        setGrid(newGrid);
        
        // Count undiscovered tiles
        const discoveredCount = stats.grid.filter((tile: any) => tile.revealed).length;
        setUndiscoveredCount(25 - discoveredCount);
      } else {
        // Initialize new grid if none exists
        const newGrid = generateGameGrid();
        setGrid(newGrid);
        setUndiscoveredCount(24);
        await saveGridProgress(newGrid, 0);
      }
    } catch (err) {
      handleError(err, 'network');
    }
  };

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
    if (user?.id) {
      loadUserStats()
    }
  }, [user?.id])

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
          const response = await fetch('/api/game-state', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: user?.id,
              moves: newMoves,
              gold,
              lastMoveRefresh: now.toISOString()
            })
          });

          if (!response.ok) {
            throw new Error('Failed to refresh moves');
          }

          setMoves(newMoves)
          setLastMoveRefresh(now)
          setMoveRefreshProgress(0)
        } catch (err) {
          console.error('Error refreshing moves:', err)
        }
      }
    }

    const timer = setInterval(checkMoveRefresh, 1000)
    return () => clearInterval(timer)
  }, [moves, lastMoveRefresh, gold, user?.id])

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

  // Update saveGridProgress to use API route
  const saveGridProgress = useCallback(async (newGrid: CardState[][], newGold: number) => {
    try {
      // Convert grid to JSONB format
      const discoveredTiles = newGrid.flatMap((row, y) => 
        row.map((cell, x) => ({
          x,
          y,
          revealed: cell.revealed,
          tileType: cell.tileType,
          value: cell.value,
          eventSeen: cell.eventSeen || false
        }))
      ).filter(tile => tile.revealed);

      console.log('Saving game state:', {
        userId: user?.id,
        moves,
        gold: newGold,
        lastMoveRefresh: lastMoveRefresh.toISOString(),
        gridLength: discoveredTiles.length
      });

      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          moves,
          gold: newGold,
          lastMoveRefresh: lastMoveRefresh.toISOString(),
          grid: discoveredTiles
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save error details:', errorData);
        throw new Error(errorData.error || 'Failed to save game state');
      }
    } catch (err) {
      console.error('Save error:', err);
      handleError(err, 'save');
    }
  }, [moves, lastMoveRefresh, user?.id]);

  // Update generateGameGrid to not require character
  const generateGameGrid = (): CardState[][] => {
    const newGrid = createEmptyGrid();
    const positions: GridPosition[] = [];
    
    // Generate all possible positions
    for(let y = 0; y < 5; y++) {
      for(let x = 0; x < 5; x++) {
        if(!(x === 2 && y === 2)) { // Exclude center starting position
          positions.push({ x, y });
        }
      }
    }

    // Shuffle positions
    for(let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Place 3 events
    for(let i = 0; i < 3; i++) {
      const pos = positions[i];
      newGrid[pos.y][pos.x].tileType = 'event';
      newGrid[pos.y][pos.x].value = Math.floor(Math.random() * 6); // 0-5 gold (d6 roll)
    }

    // Place 7 high-value rewards
    for(let i = 3; i < 10; i++) {
      const pos = positions[i];
      newGrid[pos.y][pos.x].tileType = 'high-value';
      newGrid[pos.y][pos.x].value = 3;
    }

    // Center tile is always revealed
    newGrid[2][2] = {
      revealed: true,
      character: null,
      tileType: 'low-value',
      value: 0
    };

    return newGrid;
  };

  // Update fetchCharacter to only update the character
  const fetchCharacter = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching character:', id);
      
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      
      const characters = await response.json();
      const character = characters.find((c: Character) => c.id === id);
      
      if (!character) {
        throw new Error('Character not found');
      }

      // Only update the character and its position in the grid
      setSelectedCharacter(character);
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
        // Place character at current position
        newGrid[playerPosition.y][playerPosition.x] = {
          ...newGrid[playerPosition.y][playerPosition.x],
          character: character
        };
        return newGrid;
      });

    } catch (err) {
      console.error('Fetch error:', err);
      handleError(err, 'load');
    } finally {
      setLoading(false);
    }
  };

  const canMoveTo = (x: number, y: number): boolean => {
    // Check if position is within grid bounds
    if (x < 0 || x >= 5 || y < 0 || y >= 5) return false
    
    // Check if position is adjacent to current position
    const dx = Math.abs(x - playerPosition.x)
    const dy = Math.abs(y - playerPosition.y)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
  }

  // Simplify useAbility function
  const useAbility = () => {
    if (!selectedCharacter || moves < DEFAULT_ABILITY.cost) return

    // Roll 1d3 for gold
    const bonusGold = Math.floor(Math.random() * 3) + 1
    setGold(prev => prev + bonusGold)
    setMoves(prev => prev - DEFAULT_ABILITY.cost)
    
    // Play sound and save progress
    soundManager.play('move')
    saveGridProgress(grid, gold + bonusGold)
  }

  // Update handleMove for abilities
  const handleMove = async (x: number, y: number) => {
    // Check for 3D Maneuver ability range
    const isManeuverValid = selectedCharacter?.Series?.name === 'Attack on Titan' && 
      selectedAbility?.name === '3D Maneuver' &&
      Math.abs(x - playerPosition.x) <= 2 && 
      Math.abs(y - playerPosition.y) <= 2

    if (!canMoveTo(x, y) && !isManeuverValid) return
    if (moves <= 0 && !selectedAbility) return

    soundManager.play('move')
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    const targetCell = newGrid[y][x]
    
    if (selectedCharacter) {
      if (!targetCell.revealed) {
        let rewardValue = targetCell.value
        
        const newGold = gold + rewardValue
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

    if (!selectedAbility) {
      const newMoves = moves - 1
      setMoves(newMoves)
    }
  }

  // Update handleReset to use API route
  const handleReset = async () => {
    soundManager.play('reset');
    if (selectedCharacter) {
      const newGrid = generateGameGrid();
      setGrid(newGrid);
      setPlayerPosition({ x: 2, y: 2 });
      setUndiscoveredCount(24);
      setGold(0);
      setMoves(30);

      try {
        const response = await fetch(`/api/game-state?userId=${user?.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to reset game state');
        }
      } catch (err) {
        console.error('Error resetting progress:', err);
        setError('Failed to reset progress');
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

  // Update loadAvailableCharacters to use API route
  const loadAvailableCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to load characters');
      }
      
      const data = await response.json();
      // Only show characters with images
      setAvailableCharacters(data.filter((char: Character) => Array.isArray(char.GeneratedImage) && char.GeneratedImage.length > 0));
    } catch (err) {
      console.error('Error loading characters:', err);
    }
  };

  // Update user effect to not require authentication
  useEffect(() => {
    const getUser = async () => {
      try {
        // Always set a default user for the game
        setUser({
          id: 'default-user',
          email: 'player@example.com'
        });
      } catch (err) {
        console.error('Auth error:', err);
        handleError(err, 'network');
      }
    };
    getUser();
  }, []);

  // Only load character after auth is checked
  useEffect(() => {
    if (characterId) {
      fetchCharacter(parseInt(characterId))
    }
  }, [characterId])

  // Add character dialog generation
  const generateSwitchDialog = async (outgoing: Character, incoming: Character) => {
    try {
      const response = await fetch('/api/generate-dialog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outgoingCharacter: {
            name: outgoing.name,
            series: outgoing.Series?.name
          },
          incomingCharacter: {
            name: incoming.name,
            series: incoming.Series?.name
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate dialog')
      
      const dialogs = await response.json()
      return dialogs
    } catch (err) {
      console.error('Error generating dialog:', err)
      return {
        outgoing: `Good luck, ${incoming.name}!`,
        incoming: `Thanks, ${outgoing.name}! I'll take it from here!`
      }
    }
  }

  // Update handleCharacterSwitch
  const handleCharacterSwitch = async (newCharacter: Character) => {
    if (moves < 10) return
    if (newCharacter.id === selectedCharacter?.id) return
    
    setSwitchLoading(true)
    try {
      if (selectedCharacter) {
        // Generate dialog between characters
        const dialogs = await generateSwitchDialog(selectedCharacter, newCharacter)
        
        // Show switch dialog
        setSwitchDialog({
          isOpen: true,
          outgoingDialog: dialogs.outgoing,
          incomingDialog: dialogs.incoming,
          outgoingCharacter: selectedCharacter,
          incomingCharacter: newCharacter
        })

        // Update URL without reload
        const url = new URL(window.location.href)
        url.searchParams.set('character', newCharacter.id.toString())
        window.history.pushState({}, '', url.toString())

        // Animate character switch after dialog
        setTimeout(() => {
          setSelectedCharacter(newCharacter)
          setMoves(prev => prev - 10)
          soundManager.play('move')
          setSwitchDialog(prev => ({ ...prev, isOpen: false }))
        }, 3000) // Show dialog for 3 seconds
      }
    } catch (err) {
      console.error('Error switching character:', err)
      setError('Failed to switch character. Please try again.')
      setErrorType('network')
    } finally {
      setSwitchLoading(false)
    }
  }

  // Add Character Switch Dialog Modal
  const renderSwitchDialog = () => (
    <AnimatePresence>
      {switchDialog.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800/90 rounded-xl p-6 max-w-2xl w-full"
          >
            <div className="flex justify-between space-x-4">
              {/* Outgoing Character */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: -20 }}
                transition={{ duration: 0.5 }}
                className="flex-1 text-center"
              >
                {switchDialog.outgoingCharacter?.GeneratedImage?.[0]?.url && (
                  <img
                    src={switchDialog.outgoingCharacter.GeneratedImage[0].url}
                    alt={switchDialog.outgoingCharacter.name}
                    className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                  />
                )}
                <p className="text-blue-400 font-bold">
                  {switchDialog.outgoingCharacter?.name}
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 p-3 bg-gray-700/50 rounded-lg"
                >
                  <p className="text-gray-300 italic">"{switchDialog.outgoingDialog}"</p>
                </motion.div>
              </motion.div>

              {/* Incoming Character */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: 20 }}
                transition={{ duration: 0.5 }}
                className="flex-1 text-center"
              >
                {switchDialog.incomingCharacter?.GeneratedImage?.[0]?.url && (
                  <img
                    src={switchDialog.incomingCharacter.GeneratedImage[0].url}
                    alt={switchDialog.incomingCharacter.name}
                    className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                  />
                )}
                <p className="text-green-400 font-bold">
                  {switchDialog.incomingCharacter?.name}
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-2 p-3 bg-gray-700/50 rounded-lg"
                >
                  <p className="text-gray-300 italic">"{switchDialog.incomingDialog}"</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Simplify ability UI
  const renderAbilityButton = () => {
    if (!selectedCharacter) return null

    return (
      <button
        onClick={useAbility}
        disabled={moves < DEFAULT_ABILITY.cost}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium
          ${moves >= DEFAULT_ABILITY.cost
            ? 'bg-purple-500 hover:bg-purple-600 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
        `}
      >
        {DEFAULT_ABILITY.name} ({DEFAULT_ABILITY.cost} moves)
        <span className="block text-xs opacity-75">{DEFAULT_ABILITY.description}</span>
      </button>
    )
  }

  if (gameLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="mt-4 text-gray-400">Loading game...</p>
      </div>
    )
  }

  if (gameError) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400 text-lg font-semibold">{gameError}</p>
          
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <PlayerStats />
        <Button
          onClick={saveAndExit}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save & Exit
        </Button>
      </div>

      {/* Game grid here */}
      <div className="grid grid-cols-5 gap-2">
        {gameState.tilemap.map((tile) => (
          <div
            key={tile.id}
            className="aspect-square bg-gray-800 rounded-lg"
            onClick={() => movePlayer(tile.id)}
          >
            {/* Tile content */}
          </div>
        ))}
      </div>

      {/* Completion Animation */}
      <AnimatePresence>
        {gameState.isCompleting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-lg p-8 text-center"
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold mb-2">Board Complete!</h2>
              <p className="text-gray-600">Returning to CharaSphere...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {error}
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