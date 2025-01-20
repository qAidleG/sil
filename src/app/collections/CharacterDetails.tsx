'use client'

import { useState } from 'react'
import { Character } from '@/types/database'
import { ImageIcon, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImageGenerationForm {
  pose: 'portrait' | 'action' | 'dramatic'
  style: 'anime' | 'realistic' | 'painterly'
  mood: 'neutral' | 'happy' | 'serious' | 'intense'
  background: 'card' | 'scene' | 'abstract'
}

interface CharacterDetailsProps {
  character: Character
  onUpdate: (character: Character) => void
}

export function CharacterDetails({ character, onUpdate }: CharacterDetailsProps) {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-white">
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
        <p className="text-gray-300">
          {character.bio || 'No biography available'}
        </p>
      </div>
      
      {character.dialogs && character.dialogs.length > 0 && (
        <div>
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

      {character.GeneratedImage && character.GeneratedImage.length > 0 && (
        <div>
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
                  />
                </div>
              )
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