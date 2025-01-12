import { NextResponse } from 'next/server'

const FLUX_API_URL = 'https://api.bfl.ml'

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
    console.log('1. Initial Request Data:', {
      prompt,
      apiKey: fluxApiKey.substring(0, 4) + '...'
    })

    // Format the prompt to enhance image quality
    const formattedPrompt = `Create a League of Legends style splash art of ${prompt}. High quality anime art style with dynamic lighting and composition.`
    console.log('2. Formatted Prompt:', formattedPrompt)

    // Initial request to create the generation task
    const requestBody = {
      prompt: formattedPrompt,
      width: 512,
      height: 768,
      output_format: "jpeg",
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 6
    }
    console.log('3. Request Body:', JSON.stringify(requestBody, null, 2))

    console.log('4. Creating generation task...')
    const response = await fetch(`${FLUX_API_URL}/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': fluxApiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Flux API Error:', errorText)
      return NextResponse.json(
        { error: 'Error creating generation task' },
        { status: 200 }
      )
    }

    const task = await response.json()
    console.log('Task created:', task)

    // Poll for task completion
    console.log('5. Polling for task completion...')
    const maxAttempts = 40
    const pollInterval = 500 // 0.5 seconds
    const maxRetries = 3 // Max retries for network errors

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Poll attempt ${attempt}/${maxAttempts}`)
      
      let retryCount = 0
      while (retryCount < maxRetries) {
        try {
          const resultResponse = await fetch(`${FLUX_API_URL}/v1/get_result?id=${task.id}`, {
            method: 'GET',
            headers: {
              'X-Key': fluxApiKey
            }
          })

          if (!resultResponse.ok) {
            const errorData = await resultResponse.json()
            if (resultResponse.status === 404) {
              // Task not found yet, continue polling
              break
            }
            throw new Error(`Result check failed: ${resultResponse.status} ${JSON.stringify(errorData)}`)
          }

          const result = await resultResponse.json()
          console.log('Result response:', result)

          if (result.status === 'Ready' && result.result?.sample) {
            console.log('Image is ready!')
            console.log('Generation complete:', result.result.sample)
            return NextResponse.json({ image_url: result.result.sample })
          }

          // If we get here, the task is still processing
          break

        } catch (error) {
          retryCount++
          if (retryCount === maxRetries) {
            console.error(`Failed after ${maxRetries} retries:`, error)
            throw error
          }
          console.log(`Retry ${retryCount}/${maxRetries} after error:`, error)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
        }
      }

      // Wait before next poll attempt
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    return NextResponse.json(
      { error: 'Generation timed out' },
      { status: 200 }
    )
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