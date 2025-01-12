import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.bfl.ai/v1/generate_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt_template: "Generate artwork for [Character Name] in [Room Name].",
        variables: {
          character_name: prompt,
          series: "Unknown",
          room_name: "Default Room",
          art_style_instructions: "Modern, high-quality digital art style"
        },
        output_format: "image_url"
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Flux API Error:', errorText)
      return NextResponse.json(
        { image_url: null, error: 'Sorry, there was an error generating the image.' },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      image_url: data.image_url || null
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { image_url: null, error: 'Sorry, there was an error processing your request.' },
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