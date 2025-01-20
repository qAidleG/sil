'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { StarField } from '../components/StarField'
import { Home, LayoutGrid, Swords, Trophy, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Character } from '@/types/database'
import { supabase } from '@/lib/supabase'

export default function CharaSpherePage() {
  const router = useRouter()
  const [showPlayModal, setShowPlayModal] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  const loadCharacters = async () => {
    setLoading(true)
    try {
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
        .order('createdAt', { ascending: false })

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

  const startGame = async (character: Character) => {
    if (!character.GeneratedImage?.length) {
      setLoading(true)
      try {
        // Generate image
        const { data: imageData, error: imageError } = await supabase.rpc(
          'generate_character_image',
          { character_id: character.id }
        )
        
        if (imageError) throw imageError

        // Refresh character data to get the new image
        const { data: refreshedChar, error: refreshError } = await supabase
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
          .eq('id', character.id)
          .single()

        if (refreshError) throw refreshError
        if (!refreshedChar.GeneratedImage?.length) {
          throw new Error('Failed to generate character image')
        }

        // Update local state
        setCharacters(chars => chars.map(c => 
          c.id === character.id ? refreshedChar : c
        ))
        
        // Start game with refreshed character
        router.push(`/charasphere/game?character=${refreshedChar.id}`)
      } catch (err) {
        console.error('Error generating image:', err)
        // Show error message to user
        // You might want to add error state and UI for this
      } finally {
        setLoading(false)
      }
    } else {
      router.push(`/charasphere/game?character=${character.id}`)
    }
  }

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
              onClick={() => setShowPlayModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
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
                    {characters.map(character => (
                      <button
                        key={character.id}
                        onClick={() => startGame(character)}
                        className={`
                          relative aspect-[3/4] rounded-lg overflow-hidden border
                          ${character.GeneratedImage?.length
                            ? 'border-gray-700 hover:border-green-500 cursor-pointer'
                            : 'border-gray-700 hover:border-blue-500 cursor-pointer'}
                        `}
                      >
                        {character.GeneratedImage?.[0]?.url ? (
                          <img
                            src={character.GeneratedImage[0].url}
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                            <p className="text-gray-400 text-sm mb-2">No image</p>
                            <p className="text-blue-400 text-xs">Click to generate</p>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-sm font-semibold truncate">{character.name}</p>
                          <p className="text-xs text-gray-400 truncate">{character.Series?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
} 