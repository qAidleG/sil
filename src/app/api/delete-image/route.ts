import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const characterId = searchParams.get('characterid')
    const imageField = searchParams.get('field') // e.g., 'image1url', 'image2url', etc.

    if (!characterId || !imageField) {
      return NextResponse.json({ error: 'Character ID and image field are required' }, { status: 400 })
    }

    // Clear the specified image URL
    const { error: updateError } = await supabaseAdmin
      .from('Roster')
      .update({ [imageField]: null })
      .eq('characterid', characterId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
} 