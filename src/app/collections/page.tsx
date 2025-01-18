'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Character } from '@/types/database'
import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home, Search, SortAsc, Star, Plus, X } from 'lucide-react'

interface CreateCharacterForm {
  name: string
  bio: string
  rarity: number
  seriesId: number | null
  dialogs: string[]
  currentDialog: string
}

export default function CollectionsPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null)
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rarity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCharacterForm>({
    name: '',
    bio: '',
    rarity: 3,
    seriesId: null,
    dialogs: [],
    currentDialog: ''
  })

  // Get unique universes from characters
  const universes = React.useMemo(() => {
    const uniqueUniverses = new Set(
      characters
        .filter(char => char.Series?.universe)
        .map(char => char.Series!.universe)
    )
    return Array.from(uniqueUniverses)
  }, [characters])

  // Filter and sort characters
  const filteredCharacters = React.useMemo(() => {
    return characters
      .filter(char => {
        const matchesSearch = searchQuery === '' || 
          char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          char.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesRarity = selectedRarity === null || char.rarity === selectedRarity
        
        const matchesUniverse = selectedUniverse === null || 
          char.Series?.universe === selectedUniverse

        return matchesSearch && matchesRarity && matchesUniverse
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        } else {
          return sortOrder === 'asc'
            ? a.rarity - b.rarity
            : b.rarity - a.rarity
        }
      })
  }, [characters, searchQuery, selectedRarity, selectedUniverse, sortBy, sortOrder])

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
            universe
          )
        `)
        .order('name')
      
      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '401' || error.code === '42501') {
          setError('Authentication error. Please check your API credentials.')
        } else {
          setError('Failed to load characters. Please try again later.')
        }
        return
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

  const handleCreateCharacter = async () => {
    try {
      setError(null)
      if (!createForm.name.trim()) {
        setError('Character name is required')
        return
      }

      const { data, error } = await supabase
        .from('Character')
        .insert([{
          name: createForm.name,
          bio: createForm.bio,
          seriesId: createForm.seriesId,
          rarity: createForm.rarity,
          dialogs: createForm.dialogs
        }])
        .select()

      if (error) {
        console.error('Error creating character:', error)
        if (error.code === '42501') {
          setError('Permission denied. Please check your database permissions.')
        } else if (error.code === '401') {
          setError('Authentication error. Please check your API credentials.')
        } else {
          setError('Failed to create character. Please try again later.')
        }
        return
      }
      
      console.log('Created character:', data)
      fetchCharacters() // Refresh the list
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        bio: '',
        rarity: 3,
        seriesId: null,
        dialogs: [],
        currentDialog: ''
      })
    } catch (error) {
      console.error('Error creating character:', error)
      setError('Failed to create character. Please check console for details.')
    }
  }

  const addDialog = () => {
    if (createForm.currentDialog.trim()) {
      setCreateForm(prev => ({
        ...prev,
        dialogs: [...prev.dialogs, prev.currentDialog.trim()],
        currentDialog: ''
      }))
    }
  }

  const removeDialog = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      dialogs: prev.dialogs.filter((_, i) => i !== index)
    }))
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
            <Home size={20} />
            <span>Home</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Character Collection
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Character</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p>{error}</p>
            {(error.includes('Authentication') || error.includes('Permission')) && (
              <p className="mt-2 text-sm">
                Make sure your environment variables are properly set in Vercel:
                <br />
                - NEXT_PUBLIC_SUPABASE_URL
                <br />
                - NEXT_PUBLIC_SUPABASE_ANON_KEY
              </p>
            )}
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Rarity Filter */}
            <select
              value={selectedRarity || ''}
              onChange={(e) => setSelectedRarity(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Rarities</option>
              {[5, 4, 3, 2, 1].map((rarity) => (
                <option key={rarity} value={rarity}>
                  {'★'.repeat(rarity)} ({rarity} Star)
                </option>
              ))}
            </select>

            {/* Universe Filter */}
            <select
              value={selectedUniverse || ''}
              onChange={(e) => setSelectedUniverse(e.target.value || null)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Universes</option>
              {universes.map((universe) => (
                <option key={universe} value={universe}>
                  {universe}
                </option>
              ))}
            </select>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'rarity')}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="rarity">Sort by Rarity</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
              >
                <SortAsc className={`transform transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-400">
            Showing {filteredCharacters.length} of {characters.length} characters
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No characters found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}

        {/* Create Character Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full bg-gray-800/90 rounded-xl p-6 animate-float">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Create New Character</h2>
              
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Character name"
                  />
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-sm font-medium mb-1">Biography</label>
                  <textarea
                    value={createForm.bio}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none h-32"
                    placeholder="Character biography"
                  />
                </div>

                {/* Rarity Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Rarity</label>
                  <select
                    value={createForm.rarity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, rarity: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {'★'.repeat(rarity)} ({rarity} Star)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dialogs */}
                <div>
                  <label className="block text-sm font-medium mb-1">Dialogs</label>
                  <div className="space-y-2">
                    {createForm.dialogs.map((dialog, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1 p-2 bg-gray-900/50 border border-gray-700 rounded-lg">
                          {dialog}
                        </div>
                        <button
                          onClick={() => removeDialog(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={createForm.currentDialog}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, currentDialog: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addDialog()}
                        className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Add a dialog line (press Enter)"
                      />
                      <button
                        onClick={addDialog}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCharacter}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Create Character
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

interface CharacterCardProps {
  character: Character
}

function CharacterCard({ character }: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
    <div 
      className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-500 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 ${
        isExpanded ? 'col-span-2 row-span-2 scale-100' : 'hover:scale-105'
      }`}
    >
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
              Series: {character.Series.name} | Universe: {character.Series.universe}
            </p>
          )}
          <p className={`text-gray-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
            {character.bio || 'No biography available'}
          </p>
        </div>
        
        {isExpanded && character.dialogs && character.dialogs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Dialogs</h3>
            <div className="space-y-2">
              {character.dialogs.map((dialog, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  {dialog}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {character.dialogs?.length || 0} dialogs
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isExpanded ? '← Collapse' : 'View Details →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 