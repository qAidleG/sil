import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, messages = [], apiKey } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const grokKey = apiKey || process.env.GROK_API_KEY

    if (!grokKey) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 401 }
      )
    }

    // Prepare the conversation history
    const conversationHistory = [
      {
        role: "system",
        content: "You are Grok, a helpful AI assistant with image generation capabilities. When users ask you to generate images, respond enthusiastically and include the phrase 'generate image' in your response, followed by a clear description of what you'll generate."
      },
      ...messages, // Include previous messages
      {
        role: "user",
        content: message
      }
    ]

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokKey}`
      },
      body: JSON.stringify({
        messages: conversationHistory,
        model: "grok-2-1212"
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API Error:', errorText)
      return NextResponse.json(
        { error: 'Error communicating with Grok' },
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
      { error: 'Internal server error' },
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