'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Character } from '@/types/database'
import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home, Search, SortAsc, Star, Plus, X, ImageIcon, Upload, Swords, Trash2 } from 'lucide-react'
import { getCharacters } from '@/lib/database'

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
  facing: 'left' | 'right'
  mood: 'happy' | 'determined' | 'fierce' | 'calm'
  background: 'nature' | 'battle' | 'mystical' | 'city'
}

export default function CollectionsPage() {
  console.log('CollectionsPage: Component initialized')
  
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null)
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rarity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAll, setShowAll] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    console.log('CollectionsPage: State updated', {
      searchQuery,
      selectedRarity,
      selectedUniverse,
      sortBy,
      sortOrder
    })
  }, [searchQuery, selectedRarity, selectedUniverse, sortBy, sortOrder])

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

  // Add auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      const characters = await getCharacters(user?.id || '', showAll);
      console.log('Fetched characters:', characters);
      
      setCharacters(characters);
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CollectionsPage: Fetching initial characters');
    fetchCharacters();
  }, [showAll]);

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
          characterId: character.characterid,
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

  const handleDeleteImage = async (characterId: string, imageField: string) => {
    try {
      const response = await fetch(`/api/delete-image?characterid=${characterId}&field=${imageField}`, {
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

  // Modify the return statement to show login button when not authenticated
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <StarField />
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your collection</h1>
            <button
              onClick={() => {
                // Implement login functionality
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </main>
    )
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
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p>{error}</p>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-min gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard 
                key={character.characterid} 
                character={character}
                onQuickGenerate={handleQuickGenerate}
                onDeleteImage={handleDeleteImage}
                setError={setError}
                fetchCharacters={fetchCharacters}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface CharacterCardProps {
  character: Character
  onQuickGenerate: (character: Character) => void
  onDeleteImage: (characterId: string, imageField: string) => Promise<void>
  setError: (error: string | null) => void
  fetchCharacters: () => Promise<void>
}

function CharacterCard({ character, onQuickGenerate, onDeleteImage, setError, fetchCharacters }: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageForm, setImageForm] = useState<ImageGenerationForm>({
    facing: 'right',
    mood: 'determined',
    background: 'nature'
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
    
    try {
      const basePrompt = `Create a high-quality Pokémon-style trading card art of ${character.name}, a ${character.bio?.split('.')[0]}. `
      
      const facingPrompt = {
        left: 'Character is facing left, showing their profile with dynamic energy.',
        right: 'Character is facing right, showing their profile with dynamic energy.'
      }[imageForm.facing]
      
      const moodPrompt = {
        happy: 'Expression is cheerful and friendly, like a partner Pokémon.',
        determined: 'Expression shows determination and readiness for battle.',
        fierce: 'Expression is intense and powerful, like a legendary Pokémon.',
        calm: 'Expression is serene and wise, showing inner strength.'
      }[imageForm.mood]
      
      const backgroundPrompt = {
        nature: 'Set in a vibrant natural environment with Pokémon-style flora and atmospheric effects.',
        battle: 'Dynamic battle arena background with energy effects and dramatic lighting.',
        mystical: 'Mystical location with swirling energy and magical elements, like a legendary Pokémon encounter.',
        city: 'Modern city environment with a Pokémon world aesthetic, showing urban integration.'
      }[imageForm.background]

      const fullPrompt = `${basePrompt}${facingPrompt} ${moodPrompt} ${backgroundPrompt} Ensure high quality, vibrant colors, and clean linework in the style of official Pokémon card art. Add subtle energy effects and dynamic lighting.`

      const response = await fetch('/api/flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          seed: Math.floor(Math.random() * 1000000),
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
          characterId: character.characterid,
          url: data.image_url,
          prompt: fullPrompt,
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

        {/* Character Images Grid */}
        {isExpanded && (
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Character Images</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { field: 'image1url', url: character.image1url || undefined },
                { field: 'image2url', url: character.image2url || undefined },
                { field: 'image3url', url: character.image3url || undefined },
                { field: 'image4url', url: character.image4url || undefined },
                { field: 'image5url', url: character.image5url || undefined },
                { field: 'image6url', url: character.image6url || undefined }
              ].filter(img => img.url !== undefined).map(({ field, url }, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <img
                    src={url}
                    alt={`${character.name} art ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onDeleteImage(character.characterid.toString(), field)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 space-y-6">
            {/* Advanced Generation Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Facing</label>
                <select
                  value={imageForm.facing}
                  onChange={(e) => setImageForm(prev => ({ ...prev, facing: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="left">Facing Left</option>
                  <option value="right">Facing Right</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mood</label>
                <select
                  value={imageForm.mood}
                  onChange={(e) => setImageForm(prev => ({ ...prev, mood: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="happy">Happy</option>
                  <option value="determined">Determined</option>
                  <option value="fierce">Fierce</option>
                  <option value="calm">Calm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Background</label>
                <select
                  value={imageForm.background}
                  onChange={(e) => setImageForm(prev => ({ ...prev, background: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="nature">Nature</option>
                  <option value="battle">Battle Arena</option>
                  <option value="mystical">Mystical</option>
                  <option value="city">City</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href={`/charasphere/game?character=${character.characterid}`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <Swords size={18} />
                <span>Play Game</span>
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