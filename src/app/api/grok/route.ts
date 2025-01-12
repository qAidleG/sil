import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, apiKey } = body

    const response = await fetch('https://api.x.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt_template: "Create a detailed character profile for the gacha pull.",
        variables: {
          character_name: message,
          series: "Unknown",
          rarity: "Unknown"
        },
        output_format: "json",
        fields: {
          profile_bio: "[Generated Bio]",
          traits: "[Generated Personality Traits]",
          dialog_samples: ["Dialog 1"]
        }
      }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 