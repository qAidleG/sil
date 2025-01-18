import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { characterId, url, prompt, style, seed } = await request.json()

    // Validate required fields
    if (!characterId) {
      return NextResponse.json(
        { error: 'characterId is required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // First, ensure we have a UserCollection entry
    const { data: userCollection, error: collectionError } = await supabaseAdmin
      .from('UserCollection')
      .insert([{
        userId: 'default',  // We can use a default user ID for now
        characterId: characterId,
        createdAt: now
      }])
      .select()
      .single()

    if (collectionError) {
      console.error('Error creating user collection:', collectionError)
      return NextResponse.json({ error: collectionError.message }, { status: 500 })
    }

    // Then create the generated image
    const { error: imageError } = await supabaseAdmin
      .from('GeneratedImage')
      .insert([{
        characterId,
        collectionId: userCollection.id,  // Use the ID from the created UserCollection
        url,
        prompt,
        style,
        seed,
        createdAt: now,
        updatedAt: now
      }])

    if (imageError) {
      console.error('Error storing image:', imageError)
      return NextResponse.json({ error: imageError.message }, { status: 500 })
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