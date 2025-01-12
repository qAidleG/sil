import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, apiKey } = body

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