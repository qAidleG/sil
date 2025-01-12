import { NextResponse } from 'next/server'

const FLUX_API_URL = 'https://api.bfl.ml';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// Validate the request body against required parameters
function validateRequest(body: any) {
  const requiredFields = ['prompt'];
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
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(`${FLUX_API_URL}/v1/generation/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to get generation result: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Poll attempt ${attempt}/${maxAttempts}`);
        console.log('Result response:', data);

        if (data.status === 'Ready' && data.result?.sample) {
          console.log('Image is ready!');
          return data.result.sample;
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
  console.log('=== Starting Flux Generation Process ===');
  try {
    const { prompt, apiKey } = await request.json();
    console.log('1. Initial Request Data:', {
      prompt,
      apiKey: apiKey?.substring(0, 4) + '...'
    });

    validateRequest({ prompt });

    // Use provided API key or fall back to environment variable
    const fluxApiKey = apiKey || process.env.FLUX_API_KEY;

    if (!fluxApiKey) {
      return NextResponse.json(
        { error: 'No API key provided' },
        { status: 401 }
      );
    }

    // Format the prompt to match the desired style
    const formattedPrompt = `Create a League of Legends style splash art of ${prompt}. High quality anime art style with dynamic lighting and composition.`;
    console.log('2. Formatted Prompt:', formattedPrompt);

    // Prepare the request body
    const requestBody = {
      prompt: formattedPrompt,
      width: 512,
      height: 768,
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 6,
      output_format: "jpeg"
    };
    console.log('3. Request Body:', JSON.stringify(requestBody, null, 2));

    // Create the generation task
    console.log('4. Creating generation task...');
    const createResponse = await fetch(`${FLUX_API_URL}/v1/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fluxApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('Flux API Error:', error);
      return NextResponse.json(
        { error: 'Failed to create generation task' },
        { status: 200 }
      );
    }

    const { id: taskId } = await createResponse.json();
    console.log('Task created:', { id: taskId });

    // Poll for the result
    console.log('5. Polling for task completion...');
    const imageUrl = await getGenerationResult(taskId, fluxApiKey);
    console.log('Generation complete:', imageUrl);

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 200 }
    );
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