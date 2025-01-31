'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { StarField } from '../components/StarField'
import { Home, LayoutGrid, Swords, Trophy, User, X, Loader2, Gift, Coins, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Roster, PlayerStats } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { CharacterDetails } from '@/app/collections/CharacterDetails'
import { useAuth, AuthContextType } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { PlayerStats as PlayerStatsComponent } from '@/components/PlayerStats'
import { GameState } from '@/types/game'
import { toast } from 'react-hot-toast'
import { useGameState } from '@/hooks/useGameState'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getPlayerStats, initializePlayerStats } from '@/lib/database'

export default function CharaSpherePage() {
  const router = useRouter()
  const auth = useAuth() as AuthContextType
  const { user, loading: userLoading, userDetails } = auth
  const { gameState } = useGameState()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Roster | null>(null)
  const [characters, setCharacters] = useState<Roster[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimingStarter, setClaimingStarter] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (userLoading) return
    if (!user?.id) {
      router.push('/login')
      return
    }

  const loadCharacters = async () => {
      try {
    setLoading(true)
        const response = await fetch(`/api/characters?userId=${user.id}`)
        if (!response.ok) throw new Error('Failed to load characters')
        
        const data = await response.json()
        setCharacters(data)
        setError(null)
      } catch (err) {
        console.error('Error loading characters:', err)
        setError('Failed to load characters')
      } finally {
        setLoading(false)
      }
    }

    loadCharacters()
  }, [user, userLoading, router])

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch(`/api/characters?userId=${user?.id}`)
      if (!response.ok) throw new Error('Failed to load characters')
      
      const data = await response.json()
      setCharacters(data)
      setShowClaimModal(true)
    } catch (err) {
      console.error('Error loading characters:', err)
      setError('Failed to load characters')
    } finally {
      setLoading(false)
    }
  }

  const handleCharacterClick = (character: Roster) => {
    setSelectedCharacter(character)
  }

  const handleCloseDetails = () => {
    setSelectedCharacter(null)
  }

  const handlePlay = () => {
    if (selectedCharacter?.image1url) {
      router.push(`/charasphere/game?character=${selectedCharacter.characterid}`)
    }
  }

  useEffect(() => {
    const checkGameState = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/game-state?userId=${user.id}`)
        if (!response.ok) throw new Error('Failed to check game state')
        
        const data = await response.json()
        if (data.gameState) {
          router.push('/charasphere/game')
        }
      } catch (error) {
        console.error('Error checking game state:', error)
      } finally {
        setLoading(false)
      }
    }

    checkGameState()
  }, [user?.id, router])

  const isBoardCompleted = (state: GameState) => {
    return state.tilemap.every(tile => tile.discovered)
  }

  const handleGameStart = async () => {
    if (!user?.id) return

    if (gameState && !isBoardCompleted(gameState)) {
      router.push('/charasphere/game')
    } else {
      try {
        await fetch(`/api/game-state?userId=${user.id}`, {
          method: 'DELETE'
        })
        
        router.push('/charasphere/game')
      } catch (error) {
        console.error('Error starting new game:', error)
      }
    }
  }

  const filteredCharacters = characters
    .filter(char => char.characterid)
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderCharacterCard = (character: Roster) => (
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
        const stats = await getPlayerStats(user.id)
        if (stats) {
          setPlayerStats(stats)
        } else {
          // This should never happen due to auth callback, but handle it just in case
          console.error('Player stats not found')
          setError('Failed to load player stats')
        }
      } catch (err) {
        console.error('Error loading stats:', err)
        setError('Failed to load player stats')
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading) {
      if (!user?.id) {
        router.push('/login')
      } else {
        loadStats()
      }
    }
  }, [user?.id, userLoading, router])

  const handleStarterPack = async () => {
    if (!user?.id) return
    setClaimingStarter(true)
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
        // Get updated stats
        const stats = await getPlayerStats(user.id)
        if (stats) {
          setPlayerStats(stats)
        }
      }
    } catch (err) {
      console.error('Error claiming starter pack:', err)
      toast.error('Failed to claim starter pack')
    } finally {
      setClaimingStarter(false)
    }
  }

  // Show loading state while auth is being checked
  if (userLoading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <StarField />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* User Profile Section */}
        {user && (
          <div className="flex items-center gap-4 mb-8">
            {userDetails?.avatar_url ? (
              <img
                src={userDetails.avatar_url}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-purple-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-purple-500">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {userDetails?.name || user.email?.split('@')[0]}
              </h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h1 className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            CharaSphere
          </h1>
          <p className="text-xl text-center text-gray-300 mb-8">
            Collect, build decks, and battle with your favorite characters
          </p>

          <div className="max-w-md mx-auto bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
            {playerStats ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
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
                      <span className="font-bold">{playerStats.cards}</span>
                    </div>
                    <p className="text-xs text-gray-400">Cards</p>
                  </div>
                </div>

                {playerStats.cards === 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleStarterPack}
                      disabled={claimingStarter}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                    >
                      {claimingStarter ? (
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
              </>
            ) : (
              <div className="text-center py-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                <p className="text-sm text-gray-400 mt-2">Loading stats...</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <Link 
            href="/charasphere/game"
            className={`group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-green-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm ${
              !playerStats?.cards ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={e => !playerStats?.cards && e.preventDefault()}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-16 h-16 text-green-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Play CharaSphere</h2>
              <p className="text-sm text-gray-400">
                {playerStats?.cards ? 'Start your adventure' : 'Claim starter pack to play'}
              </p>
            </div>
          </Link>

          {(!playerStats || playerStats.cards === 0) && (
            <div className="lg:col-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 backdrop-blur-sm p-6 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Welcome to CharaSphere!</h2>
              <p className="text-gray-300 mb-6 text-center">Begin your journey with a starter pack of characters</p>
              <button
                onClick={handleStarterPack}
                disabled={claimingStarter}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claimingStarter ? (
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

          {(!playerStats || playerStats.cards > 0) && (
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