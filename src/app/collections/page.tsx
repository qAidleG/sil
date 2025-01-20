'use client'

import React, { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Character } from '@/types/database'
import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home, Search, SortAsc, Star, Plus, X, ImageIcon, Upload, Swords } from 'lucide-react'
import { giveStarterPack, getCharacters } from '@/lib/database'

interface Series {
  id: number
  name: string
  universe: string
}

interface GeneratedImage {
  id: number
  characterId: number
  url: string
  prompt: string
  style: string
  createdAt: string
}

interface CreateCharacterForm {
  name: string
  bio: string
  rarity: number
  seriesId: number | null
  dialogs: string[]
  currentDialog: string
}

interface ImageGenerationForm {
  pose: 'portrait' | 'action' | 'dramatic'
  style: 'anime' | 'realistic' | 'painterly'
  mood: 'neutral' | 'happy' | 'serious' | 'intense'
  background: 'card' | 'scene' | 'abstract'
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
  const [claimingStarter, setClaimingStarter] = useState(false)
  const [showAll, setShowAll] = useState(false)

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
  }, [showAll])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && !showAll) {
        setError('Please sign in to view your collection')
        setCharacters([])
        return
      }

      const data = await getCharacters(user?.id || '', showAll)
      console.log('Fetched characters:', data)
      setCharacters(data || [])
    } catch (error: any) {
      console.error('Error fetching characters:', error)
      setError('Failed to load characters. Please try again later.')
      setCharacters([])
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

  const handleQuickGenerate = async (character: Character) => {
    if (!character) return
    setError(null)
    
    try {
      // Use default settings for quick generation
      const basePrompt = `Create a high-quality anime style trading card art of ${character.name}, a ${character.bio?.split('.')[0]}. Character shown in a noble portrait pose, facing slightly to the side, elegant and composed. Expression is determined and focused. Premium trading card game background with subtle magical effects and professional card frame. High-quality anime art style, clean lines, vibrant colors. Ensure high quality, professional trading card game art style, centered composition, high detail on character. Use dramatic lighting and rich colors.`

      console.log('Making request to /api/flux with prompt:', basePrompt)
      const response = await fetch('/api/flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        if (response.status === 400 && errorData.error.includes('Maximum of')) {
          setError(errorData.error)  // Show the max images message
        } else {
          throw new Error(`Failed to generate image: ${errorData.error || response.statusText}`)
        }
      }
      
      const data = await response.json()
      console.log('API Response Success:', data)
      
      // Store image using server-side API route
      const storeResponse = await fetch('/api/store-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          url: data.image_url,
          prompt: basePrompt,
          style: 'anime',
          seed: Math.floor(Math.random() * 1000000)
        })
      })

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json()
        console.error('Store error:', errorData)
        throw new Error(errorData.error || 'Failed to store image')
      }

      console.log('Image stored successfully')
      
      // Refresh character data to get new image
      fetchCharacters()
    } catch (error) {
      console.error('Error in quick generate:', error)
      setError('Failed to generate image. Please try again.')
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/delete-image?id=${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      fetchCharacters(); // Refresh the list
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    }
  }

  const handleClaimStarter = async () => {
    try {
      setClaimingStarter(true)
      setError(null)

      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please sign in to claim starter pack')
      }
      
      const response = await fetch('/api/starter-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include the auth token
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to claim starter pack')
      }

      // Refresh characters list
      fetchCharacters()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClaimingStarter(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="mb-6 flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
            <Home size={20} />
            <span>Home</span>
          </Link>
          <span className="text-gray-600">/</span>
          <Link href="/charasphere" className="text-blue-400 hover:text-blue-300 transition-colors">
            CharaSphere
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300">Collection</span>
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
            {/* Show All Toggle */}
            <button
              onClick={() => setShowAll(!showAll)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showAll 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-800/50 border border-gray-700 hover:border-blue-500'
              }`}
            >
              {showAll ? 'Show Owned Only' : 'Show All Characters'}
            </button>

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
            <p className="text-gray-400 text-lg mb-4">No characters found matching your criteria.</p>
            {characters.length === 0 && (
              <button
                onClick={handleClaimStarter}
                disabled={claimingStarter}
                className={`px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors ${
                  claimingStarter ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {claimingStarter ? 'Claiming...' : 'Claim Starter Pack'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-min gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character}
                onQuickGenerate={handleQuickGenerate}
                onDeleteImage={handleDeleteImage}
                setError={setError}
                fetchCharacters={fetchCharacters}
              />
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
  onQuickGenerate: (character: Character) => void
  onDeleteImage: (imageId: number) => Promise<void>
  setError: (error: string | null) => void
  fetchCharacters: () => Promise<void>
}

function CharacterCard({ character, onQuickGenerate, onDeleteImage, setError, fetchCharacters }: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageForm, setImageForm] = useState<ImageGenerationForm>({
    pose: 'portrait',
    style: 'anime',
    mood: 'neutral',
    background: 'card'
  })

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

  const handleAdvancedGenerate = async () => {
    if (generatingImage) return
    setGeneratingImage(true)
    setError(null)
    
    try {
      const basePrompt = `Create a ${imageForm.style} style trading card art of ${character.name}, a ${character.bio?.split('.')[0]}. `
      
      const posePrompt = {
        portrait: 'Character shown in a noble portrait pose, facing slightly to the side, elegant and composed.',
        action: 'Character in a dynamic action pose, showcasing their abilities and power.',
        dramatic: 'Character in a dramatic pose with intense lighting and atmosphere.'
      }[imageForm.pose]
      
      const moodPrompt = {
        neutral: 'Expression is calm and composed.',
        happy: 'Expression is confident and cheerful.',
        serious: 'Expression is determined and focused.',
        intense: 'Expression is powerful and commanding.'
      }[imageForm.mood]
      
      const backgroundPrompt = {
        card: 'Premium trading card game background with subtle magical effects and professional card frame.',
        scene: 'Contextual background showing their world or environment.',
        abstract: 'Abstract magical background with flowing energy and symbols.'
      }[imageForm.background]
      
      const styleDetails = {
        anime: 'High-quality anime art style, clean lines, vibrant colors.',
        realistic: 'Detailed realistic rendering with dramatic lighting.',
        painterly: 'Digital painting style with artistic brushstrokes.'
      }[imageForm.style]

      const fullPrompt = `${basePrompt}${posePrompt} ${moodPrompt} ${backgroundPrompt} ${styleDetails} Ensure high quality, professional trading card game art style, centered composition, high detail on character. Use dramatic lighting and rich colors.`

      // Generate a seed for consistent results
      const seed = Math.floor(Math.random() * 1000000)
      console.log('Using seed:', seed)

      const response = await fetch('/api/flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          seed: seed,
          num_inference_steps: 20,
          guidance_scale: 7.5
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && errorData.error.includes('Maximum of')) {
          throw new Error(errorData.error)  // Show the max images message
        }
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      
      // Store image using server-side API route
      const storeResponse = await fetch('/api/store-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          url: data.image_url,
          prompt: fullPrompt,
          style: imageForm.style,
          seed: seed
        })
      })

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json()
        console.error('Store error:', errorData)
        throw new Error(errorData.error || 'Failed to store image')
      }

      console.log('Image stored successfully')
      fetchCharacters()
    } catch (error) {
      console.error('Error generating image:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image. Please try again.')
    } finally {
      setGeneratingImage(false)
    }
  }

  return (
    <div 
      className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 ${
        isExpanded ? 'xl:col-span-2 xl:row-span-2 z-10' : 'hover:scale-105'
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

        {isExpanded && character.GeneratedImage && character.GeneratedImage.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Card Art</h3>
            <div className="grid grid-cols-2 gap-4">
              {character.GeneratedImage.map((image) => (
                image.url && (
                  <div 
                    key={image.id}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 group"
                  >
                    <img
                      src={image.url}
                      alt={`Card art for ${character.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onDeleteImage(image.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 space-y-6">
            {/* Advanced Generation Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pose</label>
                <select
                  value={imageForm.pose}
                  onChange={(e) => setImageForm(prev => ({ ...prev, pose: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="portrait">Portrait</option>
                  <option value="action">Action</option>
                  <option value="dramatic">Dramatic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Art Style</label>
                <select
                  value={imageForm.style}
                  onChange={(e) => setImageForm(prev => ({ ...prev, style: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="anime">Anime</option>
                  <option value="realistic">Realistic</option>
                  <option value="painterly">Painterly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mood</label>
                <select
                  value={imageForm.mood}
                  onChange={(e) => setImageForm(prev => ({ ...prev, mood: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="neutral">Neutral</option>
                  <option value="happy">Happy</option>
                  <option value="serious">Serious</option>
                  <option value="intense">Intense</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Background</label>
                <select
                  value={imageForm.background}
                  onChange={(e) => setImageForm(prev => ({ ...prev, background: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="card">Card Frame</option>
                  <option value="scene">Scene</option>
                  <option value="abstract">Abstract</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href={`/charasphere/game?character=${character.id}`}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                <Swords size={18} />
                <span>Play</span>
              </Link>
              <button
                onClick={() => onQuickGenerate(character)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              >
                <Upload size={18} />
                <span>Quick Generate</span>
              </button>
              <button
                onClick={handleAdvancedGenerate}
                disabled={generatingImage}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                {generatingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} />
                    <span>Advanced</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 