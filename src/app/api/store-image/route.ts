import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MAX_IMAGES_PER_CHARACTER = 6  // Limit to 6 images per character

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { characterId, url, prompt, style, seed } = await request.json()

    // Check how many images this character already has
    const { data: existingImages, error: countError } = await supabaseAdmin
      .from('GeneratedImage')
      .select('id')
      .eq('characterId', characterId)

    if (countError) {
      console.error('Error checking existing images:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (existingImages && existingImages.length >= MAX_IMAGES_PER_CHARACTER) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_IMAGES_PER_CHARACTER} images allowed per character. Please delete some images to generate more.` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    
    // Store the new image
    const { error: insertError } = await supabaseAdmin
      .from('GeneratedImage')
      .insert([{
        characterId,
        url,
        prompt,
        style,
        seed,
        createdAt: now,
        updatedAt: now
      }])

    if (insertError) {
      console.error('Error storing image:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 