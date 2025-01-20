import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('Character')
      .select(`
        *,
        Series (
          id,
          name,
          universe
        ),
        GeneratedImage (
          id,
          url,
          prompt,
          style,
          createdAt
        )
      `)
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in characters route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 