import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt, apiKey } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const fluxApiKey = apiKey || process.env.FLUX_API_KEY

    if (!fluxApiKey) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 401 }
      )
    }

    console.log('=== Starting Flux Generation Process ===')
    console.log('1. Initial Request:', { prompt })

    // Initial request to create the generation task
    const requestBody = {
      prompt,
      width: 1024,
      height: 768,
      output_format: "jpeg",
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 6
    }

    console.log('2. Creating generation task...')
    const response = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': fluxApiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Flux API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      return NextResponse.json(
        { error: `Error creating generation task: ${errorText}` },
        { status: response.status }
      )
    }

    const task = await response.json()
    console.log('3. Task created:', task)

    // Poll for task completion
    console.log('4. Polling for task completion...')
    const maxAttempts = 40
    const pollInterval = 500 // 0.5 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Poll attempt ${attempt}/${maxAttempts}`)
      
      const resultResponse = await fetch(`https://api.bfl.ai/v1/get_result?id=${task.id}`, {
        method: 'GET',
        headers: {
          'X-Key': fluxApiKey
        }
      })

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text()
        console.error('Result check failed:', {
          status: resultResponse.status,
          statusText: resultResponse.statusText,
          error: errorText,
          headers: Object.fromEntries(resultResponse.headers.entries())
        })
        
        if (resultResponse.status !== 404) {
          return NextResponse.json(
            { error: `Error checking generation status: ${errorText}` },
            { status: resultResponse.status }
          )
        }
      } else {
        const result = await resultResponse.json()
        console.log('5. Result response:', result)

        if (result.status === 'Ready' && result.result?.sample) {
          console.log('6. Image is ready!')
          return NextResponse.json({ image_url: result.result.sample })
        }
      }

      // Wait before next poll attempt
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    return NextResponse.json(
      { error: 'Generation timed out after 20 seconds' },
      { status: 408 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Key',
    },
  })
} 