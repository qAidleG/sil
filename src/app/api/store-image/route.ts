import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    // Find the first empty slot
    let updateField = null
    if (!character.image1url) updateField = 'image1url'
    else if (!character.image2url) updateField = 'image2url'
    else if (!character.image3url) updateField = 'image3url'
    else if (!character.image4url) updateField = 'image4url'
    else if (!character.image5url) updateField = 'image5url'
    else if (!character.image6url) updateField = 'image6url'

    if (!updateField) {
      return NextResponse.json({ error: 'Maximum of 6 images allowed' }, { status: 400 })
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