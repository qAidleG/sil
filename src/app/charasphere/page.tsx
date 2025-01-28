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
    return state.tilemap.every(tile => tile.discovered)
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

          {/* Play CharaSphere */}
          <Link 
            href="/charasphere/game"
            className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-green-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-16 h-16 text-green-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Play CharaSphere</h2>
              <p className="text-sm text-gray-400">Start your adventure</p>
            </div>
          </Link>

          {/* Future Features Section */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Coming Soon</h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Deck building with strategy guides</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Real-time battles with other players</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Character abilities and special moves</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Seasonal rankings and rewards</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
} 