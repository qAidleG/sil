'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Character } from '@/types/database'
import { StarField } from '../components/StarField'

export default function CollectionsPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching characters...')
      const { data, error } = await supabase
        .from('Character')
        .select(`
          *,
          Series (
            name,
            description
          )
        `)
        .order('name')
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched characters:', data)
      setCharacters(data || [])
    } catch (error) {
      console.error('Error fetching characters:', error)
      setError('Failed to load characters. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const createTestCharacter = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('Character')
        .insert([
          {
            name: 'Sery',
            bio: 'A mysterious character from the infinite library, known for their wisdom and charm.',
            seriesId: null,
            rarity: 5,
            dialogs: [
              'Welcome to the Infinite Library!',
              'Knowledge is power, but wisdom is eternal.',
              'Let me guide you through the realms of possibility.'
            ]
          }
        ])
        .select()

      if (error) throw error
      
      console.log('Created test character:', data)
      fetchCharacters() // Refresh the list
    } catch (error) {
      console.error('Error creating test character:', error)
      setError('Failed to create test character. Please check console for details.')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Character Collection
          </h1>
          <button
            onClick={createTestCharacter}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Create Test Character
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No characters found in the collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface CharacterCardProps {
  character: Character & {
    Series?: {
      name: string
      description: string | null
    } | null
  }
}

function CharacterCard({ character }: CharacterCardProps) {
  // Get rarity color based on rarity level
  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5: return 'text-yellow-400'
      case 4: return 'text-purple-400'
      case 3: return 'text-blue-400'
      case 2: return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20">
      <div className="p-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {character.name}
            </h2>
            <span className={`${getRarityColor(character.rarity)} text-sm font-semibold`}>
              ★{character.rarity}
            </span>
          </div>
          {character.Series && (
            <p className="text-sm text-gray-400">
              Series: {character.Series.name}
            </p>
          )}
          <p className="text-gray-300 line-clamp-3">
            {character.bio || 'No biography available'}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {character.dialogs?.length || 0} dialogs
            </span>
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 