'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { StarField } from '../components/StarField'
import { Home, LayoutGrid, Swords, Trophy, User, X, Loader2, Gift, Coins, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Character } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { CharacterDetails } from '@/app/collections/CharacterDetails'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { PlayerStats } from '@/components/PlayerStats'
import { GameState } from '@/types/game'
import { toast } from 'react-hot-toast'

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
  const [playerStats, setPlayerStats] = useState<{
    gold: number;
    moves: number;
    cards_collected: number;
  } | null>(null)
  const [loadingStarterPack, setLoadingStarterPack] = useState(false)

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

  // Load player stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return
      try {
        const { data, error } = await supabase
          .from('playerstats')
          .select('gold, moves, cards_collected')
          .eq('userid', user.id)
          .single()

        if (error) throw error
        setPlayerStats(data)
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }
    loadStats()
  }, [user?.id])

  // Handle starter pack claim
  const handleStarterPack = async () => {
    if (!user?.id) return
    setLoadingStarterPack(true)
    try {
      const response = await fetch('/api/starter-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (!response.ok) throw new Error('Failed to claim starter pack')
      
      const result = await response.json()
      if (result.success) {
        toast.success('Starter pack claimed! Check your collection.')
        // Refresh player stats
        const { data } = await supabase
          .from('playerstats')
          .select('*')
          .eq('userid', user.id)
          .single()
        setPlayerStats(data)
      }
    } catch (err) {
      console.error('Error claiming starter pack:', err)
      toast.error('Failed to claim starter pack')
    } finally {
      setLoadingStarterPack(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header with Stats */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            CharaSphere
          </h1>
          <p className="text-xl text-center text-gray-300 mb-8">
            Collect, build decks, and battle with your favorite characters
          </p>

          {playerStats && (
            <div className="max-w-md mx-auto bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-yellow-500 mb-1">
                    <Coins className="w-5 h-5" />
                    <span className="font-bold">{playerStats.gold}</span>
                  </div>
                  <p className="text-xs text-gray-400">Gold</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold">{playerStats.moves}</span>
                  </div>
                  <p className="text-xs text-gray-400">Moves</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-purple-500 mb-1">
                    <Gift className="w-5 h-5" />
                    <span className="font-bold">{playerStats.cards_collected}</span>
                  </div>
                  <p className="text-xs text-gray-400">Cards</p>
                </div>
              </div>
            </div>
          )}
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

          {/* Starter Pack Section */}
          {playerStats?.cards_collected === 0 && (
            <div className="lg:col-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 backdrop-blur-sm p-6 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Welcome to CharaSphere!</h2>
              <p className="text-gray-300 mb-6 text-center">Begin your journey with a starter pack of characters</p>
              <button
                onClick={handleStarterPack}
                disabled={loadingStarterPack}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStarterPack ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Claiming Starter Pack...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Claim Starter Pack</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Future Features Section */}
          {(!playerStats || playerStats.cards_collected > 0) && (
            <div className="lg:col-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm p-6">
              <h2 className="text-xl font-bold text-blue-400 mb-4">Coming Soon</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Economy system with daily rewards and achievements</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Game balancing and card rarity adjustments</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Event-based character interactions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>More characters and series to collect</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 