'use client'

import { useState } from 'react'
import { Character, EnrichedCharacter } from '@/types/database'
import { ImageIcon, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getImageUrl, hasImages } from '@/utils/character'
import { useUser } from '@supabase/auth-helpers-react'
import Image from 'next/image'

interface ImageGenerationForm {
  pose: 'portrait' | 'action' | 'dramatic'
  style: 'anime' | 'realistic' | 'painterly'
  mood: 'neutral' | 'happy' | 'serious' | 'intense'
  background: 'card' | 'scene' | 'abstract'
}

interface CharacterDetailsProps {
  character: Character | EnrichedCharacter
  onUpdate: (character: Character | EnrichedCharacter) => void
  selectedImageId?: number
}

export function CharacterDetails({ character, onUpdate, selectedImageId }: CharacterDetailsProps) {
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageForm, setImageForm] = useState<ImageGenerationForm>({
    pose: 'portrait',
    style: 'anime',
    mood: 'neutral',
    background: 'card'
  })
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

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

  const handleQuickGenerate = async () => {
    if (generatingImage) return
    setGeneratingImage(true)
    
    try {
      const basePrompt = `${character.name} from ${character.Series?.name}, high quality, detailed, anime style`
      
      const response = await fetch('/api/flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt })
      })

      if (!response.ok) {
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
          prompt: basePrompt,
          style: 'anime',
          seed: Math.floor(Math.random() * 1000000)
        })
      })

      if (!storeResponse.ok) {
        throw new Error('Failed to store image')
      }

      // Refresh character data
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
      onUpdate(refreshedChar)
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleAdvancedGenerate = async () => {
    if (generatingImage) return
    setGeneratingImage(true)
    
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

      const response = await fetch('/api/flux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          seed: Math.floor(Math.random() * 1000000)
        })
      })

      if (!response.ok) {
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
          seed: Math.floor(Math.random() * 1000000)
        })
      })

      if (!storeResponse.ok) {
        throw new Error('Failed to store image')
      }

      // Refresh character data
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
      onUpdate(refreshedChar)
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleImageSelect = async (imageNumber: number) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('UserCollection')
        .update({ selectedImageId: imageNumber })
        .eq('userid', user.id)
        .eq('characterid', character.characterid)

      if (error) throw error
      
      if (onUpdate) {
        onUpdate({
          ...character,
          selectedImageId: imageNumber
        })
      }
    } catch (error) {
      console.error('Error updating selected image:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-6">
        {/* Main character image */}
        <div className="w-1/3">
          {character.image1url ? (
            <img
              src={character.image1url}
              alt={character.name}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
        </div>

        {/* Character info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{character.name}</h2>
          <p className="text-gray-400 mb-4">{character.Series?.name}</p>
          <p className="text-gray-300 mb-4">{character.bio}</p>
          
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              Rarity: {character.rarity}
            </div>
            {character.Series?.universe && (
              <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                {character.Series.universe}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional character images */}
      {hasImages(character) && (
        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Card Art</h3>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((imageNumber) => {
              const imageUrl = getImageUrl(character, imageNumber)
              if (!imageUrl) return null

              const isSelected = character.selectedImageId === imageNumber

              return (
                <div key={imageNumber} className="relative">
                  <button
                    onClick={() => handleImageSelect(imageNumber)}
                    disabled={loading}
                    className={`
                      relative w-full aspect-square rounded-lg overflow-hidden
                      ${isSelected ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-gray-400'}
                    `}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${character.name} - Image ${imageNumber}`}
                      fill
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Character dialogs */}
      {character.dialogs && character.dialogs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Character Dialogs</h3>
          <div className="space-y-2">
            {character.dialogs.map((dialog, index) => (
              <div
                key={index}
                className="p-3 bg-gray-800 rounded-lg text-gray-300"
              >
                "{dialog}"
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
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
          <button
            onClick={handleQuickGenerate}
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
    </div>
  )
} 