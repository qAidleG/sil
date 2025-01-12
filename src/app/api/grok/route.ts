import { NextResponse } from 'next/server'

const functions = [
  {
    name: "generate_image",
    description: "Generate an anime-style artwork based on a text description. The image will be generated in a League of Legends splash art style with high quality and dynamic composition.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The description of what to generate. Will be automatically formatted into a League of Legends style splash art with anime aesthetics."
        }
      },
      required: ["prompt"]
    }
  }
];

const SYSTEM_INSTRUCTIONS = `You are Grok, a helpful and knowledgeable AI assistant in a chat application that can also generate images.

You have access to an image generation capability through the generate_image function. This function creates high-quality anime-style artwork in the style of League of Legends splash art.

When to use image generation:
1. When users explicitly request images or artwork
2. When users ask you to show them something
3. When users want to visualize a character, scene, or concept
4. When users ask you to test your image capabilities

The generated images will automatically be:
- In an anime art style
- High quality with dynamic lighting
- Similar to League of Legends splash art
- 512x768 pixels in size

Example scenarios to generate images:
- "Can you show me a dragon?"
- "Generate art of a sunset"
- "What would a cyberpunk samurai look like?"
- "Create an image of a magical forest"

IMPORTANT: When users ask you to test your image generation or to generate an image, you MUST use the generate_image function. Do not just describe what you would generate - actually call the function.

Keep your responses conversational and engaging. When generating images, explain what you're creating and why you chose certain elements.`;

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

    console.log('Sending request to Grok with:', {
      apiKey: apiKey.substring(0, 4) + '...',
      message
    })

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTIONS
          },
          {
            role: "user",
            content: message
          }
        ],
        functions,
        function_call: {
          name: "generate_image"
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return NextResponse.json(
        { content: `Error: ${response.status} - ${errorText || response.statusText}` },
        { status: 200 }
      )
    }

    const data = await response.json()
    console.log('Grok response:', JSON.stringify(data, null, 2))

    // Check if Grok wants to generate an image
    if (data.choices?.[0]?.message?.function_call?.name === 'generate_image') {
      try {
        const functionArgs = JSON.parse(data.choices[0].message.function_call.arguments)
        console.log('Function arguments:', functionArgs)
        
        // Call the Flux API to generate the image
        const fluxResponse = await fetch('http://localhost:3000/api/flux', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: functionArgs.prompt,
            apiKey
          })
        })

        const fluxData = await fluxResponse.json()
        console.log('Flux response:', fluxData)
        
        if (fluxData.success && fluxData.image_url) {
          return NextResponse.json({
            content: data.choices[0].message.content || "I've generated an image based on your request.",
            image_url: fluxData.image_url
          })
        } else {
          throw new Error(fluxData.error || 'Failed to generate image')
        }
      } catch (error) {
        console.error('Error generating image:', error)
        return NextResponse.json({
          content: "I tried to generate an image but encountered an error. " + 
                  (error instanceof Error ? error.message : 'Unknown error occurred')
        })
      }
    }

    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || 'No response from Grok'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { content: error instanceof Error ? error.message : 'Unknown error occurred' },
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