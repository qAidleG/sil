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

    const { characterId, url, prompt, style, seed, collectionId } = await request.json()

    // Validate required fields
    if (!characterId || !collectionId) {
      return NextResponse.json(
        { error: 'characterId and collectionId are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('GeneratedImage')
      .insert([{
        characterId,
        collectionId,
        url,
        prompt,
        style,
        seed,
        createdAt: now,
        updatedAt: now
      }])

    if (error) {
      console.error('Error storing image:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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