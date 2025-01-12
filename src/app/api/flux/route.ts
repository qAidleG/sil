import { NextResponse } from 'next/server'

const FLUX_API_URL = 'https://api.bfl.ml';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// Validate the request body against required parameters
function validateRequest(body: any) {
  const requiredFields = ['prompt', 'width', 'height', 'output_format'];
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

async function getGenerationResult(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 40;
  const pollInterval = 500; // 0.5 seconds
  const maxRetries = 3; // Max retries for network errors

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nPoll attempt ${attempt}/${maxAttempts}`);
    
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        const resultResponse = await fetch(`${FLUX_API_URL}/v1/get_result?id=${taskId}`, {
          method: 'GET',
          headers: {
            'X-Key': apiKey
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!resultResponse.ok) {
          const errorData = await resultResponse.json();
          if (resultResponse.status === 404) {
            // Task not found yet, continue polling
            break;
          }
          throw new Error(`Result check failed: ${resultResponse.status} ${JSON.stringify(errorData)}`);
        }

        const resultData = await resultResponse.json();
        console.log('Result response:', resultData);

        if (resultData.status === 'Ready' && resultData.result?.sample) {
          console.log('Image is ready!');
          return resultData.result.sample;
        }

        // If we get here, the task is still processing
        break;

      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error(`Failed after ${maxRetries} retries:`, error);
          throw error;
        }
        console.log(`Retry ${retryCount}/${maxRetries} after error:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    // Wait before next poll attempt
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout waiting for generation');
}

export async function POST(request: Request) {
  try {
    console.log('=== Starting Flux Generation Process ===');

    const requestData = await request.json();
    const { prompt, apiKey } = requestData;
    console.log('\n1. Initial Request Data:', { prompt, apiKey: apiKey?.substring(0, 4) + '...' });

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
    
    const formattedPrompt = `Create a League of Legends style splash art of ${prompt}. High quality anime art style with dynamic lighting and composition.`;
    console.log('\n2. Formatted Prompt:', formattedPrompt);
    
    const requestBody = {
      prompt: formattedPrompt,
      width: 512,
      height: 768,
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 6,
      output_format: "jpeg"
    };

    validateRequest(requestBody);
    console.log('\n3. Request Body:', JSON.stringify(requestBody, null, 2));

    // Step 1: Create generation task
    console.log('\n4. Creating generation task...');
    const createResponse = await fetch(`${FLUX_API_URL}/v1/flux-pro-1.1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Task creation failed: ${createResponse.status} ${JSON.stringify(errorData)}`);
    }

    const createData = await createResponse.json();
    console.log('Task created:', createData);

    if (!createData.id) {
      throw new Error('No task ID received');
    }

    // Step 2: Poll for task completion
    console.log('\n5. Polling for task completion...');
    const fluxImageUrl = await getGenerationResult(createData.id, apiKey);
    console.log('Generation complete:', fluxImageUrl);

    // Return the result
    return NextResponse.json({
      success: true,
      image_url: fluxImageUrl,
      seed: requestBody.seed,
      prompt: formattedPrompt
    });

  } catch (error) {
    console.error('\n❌ Flux API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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