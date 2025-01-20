import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Get the image record first to get the filename
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('GeneratedImage')
      .select('url')
      .eq('id', imageId)
      .single()

    if (fetchError) {
      console.error('Error fetching image:', fetchError)
      throw fetchError
    }

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Extract filename from URL
    const url = new URL(image.url)
    const filename = 'public/' + url.pathname.split('/').pop()

    // Delete from storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('character-images')
      .remove([filename])

    if (storageError) {
      console.error('Storage error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('GeneratedImage')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete-image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    )
  }
} 