import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }

    const { characterId, url, prompt, style, seed } = await req.json()

    if (!characterId || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the image from the Flux API URL
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from Flux API')
    }
    const imageBlob = await imageResponse.blob()

    // Convert blob to jpg if it isn't already
    const jpgBlob = new Blob([imageBlob], { type: 'image/jpeg' })

    // Generate a unique filename in the public folder
    const filename = `public/${Date.now()}-${seed}.jpg`
    
    // Upload to Supabase Storage using admin client
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('character-images')
      .upload(filename, jpgBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      throw new Error('Failed to upload image to storage')
    }

    // Get the public URL using admin client
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('character-images')
      .getPublicUrl(filename)

    // Store the record with our stored image URL using admin client
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('GeneratedImage')
      .insert([{
        characterId,
        url: publicUrl,
        prompt,
        style,
        seed,
        createdAt: now,
        updatedAt: now
      }])
      .select()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error in store-image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to store image' },
      { status: 500 }
    )
  }
} 