import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API Error:', errorText)
      return NextResponse.json(
        { content: 'Sorry, there was an error communicating with Grok.' },
        { status: 200 }
      )
    }

    const data = await response.json()
    // Ensure we return the expected format
    return NextResponse.json({
      content: data.fields?.profile_bio || 'No response from Grok'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { content: 'Sorry, there was an error processing your request.' },
      { status: 200 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 