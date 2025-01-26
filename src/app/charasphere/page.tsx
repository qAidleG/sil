'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { StarField } from '../components/StarField'
import { Home, LayoutGrid, Swords, Trophy, User, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Character } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { CharacterDetails } from '@/app/collections/CharacterDetails'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { PlayerStats } from '@/components/PlayerStats'
import { GameState } from '@/types/game'

export default function CharaSpherePage() {
  const { user } = useUser()
  const router = useRouter()
  const [showPlayModal, setShowPlayModal] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('Character')
        .select(`
          *,
          id,
          characterid,
          Series (
            id,
            seriesid,
            name,
            universe
          )
        `)
        .order('name')

      if (error) throw error
      if (data) setCharacters(data)
    } catch (err) {
      console.error('Error loading characters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await loadCharacters()
    setShowPlayModal(true)
  }

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character)
    router.push(`/charasphere/game?character=${character.characterid}`)
  }

  const handleCloseDetails = () => {
    setSelectedCharacter(null)
  }

  const handlePlay = () => {
    if (selectedCharacter?.image1url) {
      router.push(`/charasphere/game?character=${selectedCharacter.characterid}`)
    }
  }

  // Check if there's a game in progress
  useEffect(() => {
    const checkGameState = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/game-state?userId=${user.id}`)
        if (!response.ok) throw new Error('Failed to check game state')
        
        const data = await response.json()
        setGameState(data.gameState)
      } catch (error) {
        console.error('Error checking game state:', error)
      } finally {
        setLoading(false)
      }
    }

    checkGameState()
  }, [user?.id])

  // Check if board is completed
  const isBoardCompleted = (state: GameState) => {
    return state.tilemap.every(tile => tile.type === 'C' || tile.type === 'P')
  }

  const handleGameStart = async () => {
    if (!user?.id) return

    if (gameState && !isBoardCompleted(gameState)) {
      // Continue existing game
      router.push('/charasphere/game')
    } else {
      // Start new game
      try {
        // Delete any existing completed game
        await fetch(`/api/game-state?userId=${user.id}`, {
          method: 'DELETE'
        })
        
        // Navigate to game page (it will initialize a new game)
        router.push('/charasphere/game')
      } catch (error) {
        console.error('Error starting new game:', error)
      }
    }
  }

  // Update character filtering and sorting
  const filteredCharacters = characters
    .filter(char => char.characterid)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Update character grid
  const renderCharacterCard = (character: Character) => (
    <div
      key={character.characterid}
      onClick={() => handleCharacterClick(character)}
      className={`
        relative p-4 rounded-lg border-2 transition-all cursor-pointer
        ${selectedCharacter?.characterid === character.characterid
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'
        }
      `}
    >
      {character.image1url ? (
        <img
          src={character.image1url}
          alt={character.name}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
          <p className="text-gray-500">No image available</p>
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{character.name}</h3>
      <p className="text-sm text-gray-400 mb-4">{character.Series?.name}</p>
      
      {selectedCharacter?.characterid === character.characterid && (
        <div className="mt-4 space-y-4">
          <button
            onClick={handlePlay}
            disabled={!character.image1url}
            className={`
              w-full px-6 py-3 rounded-lg font-semibold
              ${character.image1url
                ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
              transition-colors
            `}
          >
            {character.image1url ? 'Play Game' : 'No Image Available'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
            <Home size={20} />
            <span>Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            CharaSphere
          </h1>
          <p className="mt-4 text-xl text-gray-300">
            Collect, build decks, and battle with your favorite characters
          </p>
        </div>

        {/* Main Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Collection Link */}
          <Link 
            href="/collections" 
            className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <LayoutGrid className="w-16 h-16 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Collection</h2>
              <p className="text-sm text-gray-400">View and manage your cards</p>
            </div>
          </Link>

          {/* Play CharaSphere - Updated to open modal */}
          <button 
            onClick={handlePlayClick}
            className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-green-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-16 h-16 text-green-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Play CharaSphere</h2>
              <p className="text-sm text-gray-400">Start your adventure</p>
            </div>
          </button>

          {/* Deck Builder Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <LayoutGrid className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Deck Builder</h2>
              <p className="text-sm text-gray-500">Create and customize decks</p>
            </div>
          </div>

          {/* Battle Arena Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Swords className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Battle Arena</h2>
              <p className="text-sm text-gray-500">Challenge other players</p>
            </div>
          </div>

          {/* Rankings Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Rankings</h2>
              <p className="text-sm text-gray-500">Global leaderboards</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <h3 className="text-xl font-bold text-blue-400 mb-2">🎮 Game Features Coming Soon</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Deck building with strategy guides</li>
            <li>Real-time battles with other players</li>
            <li>Character abilities and special moves</li>
            <li>Seasonal rankings and rewards</li>
            <li>Character evolution and power-ups</li>
          </ul>
        </div>

        {/* Character Selection Modal */}
        <AnimatePresence>
          {showPlayModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !selectedCharacter && setShowPlayModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {selectedCharacter ? (
                  <div className="relative">
                    <button
                      onClick={handleCloseDetails}
                      className="absolute right-0 top-0 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                    <CharacterDetails 
                      character={selectedCharacter}
                      onUpdate={(updatedChar: Character) => {
                        setCharacters(chars => 
                          chars.map(c => c.characterid === updatedChar.characterid ? updatedChar : c)
                        )
                        setSelectedCharacter(updatedChar)
                      }}
                    />
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handlePlay}
                        disabled={!selectedCharacter.image1url}
                        className={`
                          px-6 py-3 rounded-lg font-semibold
                          ${selectedCharacter.image1url
                            ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                          transition-colors
                        `}
                      >
                        {selectedCharacter.image1url
                          ? 'Play Game'
                          : 'Generate Image to Play'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-blue-400">Select Character</h2>
                      <button
                        onClick={() => setShowPlayModal(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
                      </div>
                    ) : characters.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No characters found</p>
                        <Link href="/collections" className="mt-4 text-blue-400 hover:text-blue-300">
                          Add characters to your collection
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filteredCharacters.map(renderCharacterCard)}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <PlayerStats className="mb-8" />
        
        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Button
              onClick={handleGameStart}
              size="lg"
              className="w-48"
            >
              {gameState && !isBoardCompleted(gameState)
                ? 'Continue Game'
                : 'New Game'}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
} 