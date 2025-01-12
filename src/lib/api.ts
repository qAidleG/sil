interface GrokResponse {
  content: string;
}

interface FluxResponse {
  image_url: string;
}

export async function sendGrokMessage(message: string, apiKey: string): Promise<GrokResponse> {
  const response = await fetch('/api/grok', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message to Grok');
  }

  return response.json();
}

export async function generateImage(prompt: string, apiKey: string): Promise<FluxResponse> {
  const response = await fetch('/api/flux', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image with Flux');
  }

  return response.json();
} 