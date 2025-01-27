import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface CharacterImages {
  image1url: string | null
  image2url: string | null
  image3url: string | null
  image4url: string | null
  image5url: string | null
  image6url: string | null
  [key: string]: string | null  // Index signature for dynamic access
}

export async function POST(req: Request) {
  try {
    const { characterId, url } = await req.json()
    
    if (!characterId || !url) {
      return NextResponse.json({ error: 'Character ID and URL are required' }, { status: 400 })
    }

    // Get the character's current image URLs
    const { data: character, error: getError } = await supabaseAdmin
      .from('Roster')
      .select('image1url, image2url, image3url, image4url, image5url, image6url')
      .eq('characterid', characterId)
      .single()

    if (getError) throw getError

    // Find the first empty slot or the oldest image slot
    let updateField = null
    const imageFields = ['image1url', 'image2url', 'image3url', 'image4url', 'image5url', 'image6url']
    
    // First try to find an empty slot
    updateField = imageFields.find(field => !(character as CharacterImages)[field])
    
    // If no empty slot, use the first slot (rotating through 1-6)
    if (!updateField) {
      updateField = 'image1url'
    }

    // Update the character with the new image URL
    const { error: updateError } = await supabaseAdmin
      .from('Roster')
      .update({ [updateField]: url })
      .eq('characterid', characterId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing image:', error)
    return NextResponse.json({ error: 'Failed to store image' }, { status: 500 })
  }
} 