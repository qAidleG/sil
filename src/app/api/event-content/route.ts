import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function generateEventContent(character: any) {
  // TODO: Replace with actual Grok API call
  const prompt = `You are ${character.name} from ${character.Series?.name}. Generate 3 unique, in-character reactions to finding 10 gold pieces. Each reaction should be a single sentence that reflects your personality and background. Respond in JSON format with keys E1, E2, and E3. Example:
  {
    "E1": "What a fortunate discovery!",
    "E2": "This gold will serve me well.",
    "E3": "A modest treasure, but welcome nonetheless."
  }`

  // Temporary mock response until Grok API is integrated
  return {
    E1: `${character.name}: "What a fortunate discovery!"`,
    E2: `${character.name}: "This gold will serve me well."`,
    E3: `${character.name}: "A modest treasure, but welcome nonetheless."`
  }
}

export async function POST(req: Request) {
  try {
    const { characterId } = await req.json()

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    // Get character details
    const { data: character, error: charError } = await supabaseAdmin
      .from('Roster')
      .select('*, Series(*)')
      .eq('characterid', characterId)
      .single()

    if (charError || !character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const eventContent = await generateEventContent(character)

    return NextResponse.json(eventContent)

  } catch (error) {
    console.error('Error generating event content:', error)
    return NextResponse.json({ error: 'Failed to generate event content' }, { status: 500 })
  }
} 