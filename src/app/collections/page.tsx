'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Character } from '@/types/database'

export default function CollectionsPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
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
      
      if (error) throw error
      setCharacters(data || [])
    } catch (error) {
      console.error('Error fetching characters:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Character Collection
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
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
  return (
    <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20">
      <div className="p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {character.name}
          </h2>
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
              {character.dialogue?.length || 0} dialogues
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