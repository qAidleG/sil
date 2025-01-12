import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, apiKey } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Use provided API key or fall back to environment variable
    const grokApiKey = apiKey || process.env.GROK_API_KEY

    if (!grokApiKey) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 401 }
      )
    }

    console.log('Sending request to Grok with:', {
      apiKey: grokApiKey.substring(0, 4) + '...',
      message
    })

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are Grok, a helpful AI assistant with image generation capabilities. When users ask you to generate images, respond enthusiastically and include the phrase 'generate image' in your response, followed by a clear description of what you'll generate. For example: 'I'll generate image of [description]' or 'Let me generate image based on [description]'."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
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
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || 'No response from Grok'
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