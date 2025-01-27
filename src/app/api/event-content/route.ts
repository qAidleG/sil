import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendGrokMessage } from '@/lib/api'

async function generateEventContent(character: any) {
  const prompt = `You are ${character.name} from ${character.Series?.name || 'an unknown series'}. ${character.bio || ''}

Generate 3 unique, in-character reactions to finding treasure during an adventure. Each reaction should be a single sentence that reflects your personality and background. The responses should be varied:
- E1: A wise or teaching moment
- E2: A discovery or exploration moment
- E3: An achievement or challenge moment

Respond in JSON format with keys E1, E2, and E3. Example:
{
  "E1": "Let me share with you the wisdom I've gained from my journey.",
  "E2": "What a fascinating discovery, it reminds me of my adventures in [relevant location].",
  "E3": "Together we've overcome this challenge, just as I did when [relevant story]."
}`

  const response = await sendGrokMessage(prompt, [], process.env.GROK_API_KEY, character.bio)
  
  try {
    // Parse the response as JSON
    const content = response.content.trim()
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}') + 1
    const jsonStr = content.slice(jsonStart, jsonEnd)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Error parsing Grok response:', error)
    // Fallback to basic responses
    return {
      E1: `${character.name}: "Let me share my wisdom with you."`,
      E2: `${character.name}: "What an interesting discovery!"`,
      E3: `${character.name}: "We've accomplished something meaningful."` 
    }
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