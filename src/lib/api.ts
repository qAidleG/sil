interface GrokResponse {
  content: string;
}

interface FluxResponse {
  image_url: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export async function sendGrokMessage(message: string, apiKey: string): Promise<GrokResponse> {
  const response = await fetch(`${BASE_URL}/api/grok`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      apiKey,
    }),
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send message to Grok');
  }

  return response.json();
}

export async function generateImage(prompt: string, apiKey: string): Promise<FluxResponse> {
  const response = await fetch(`${BASE_URL}/api/flux`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      apiKey,
    }),
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to generate image with Flux');
  }

  return response.json();
} 