import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, messages = [], apiKey, systemMessage } = await request.json()

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
        content: systemMessage
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
        { content: 'Sorry, there was an error communicating with the AI. Please try again.' },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || 'Sorry, I received an empty response. Please try again.'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { content: 'Sorry, there was an unexpected error. Please try again.' },
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