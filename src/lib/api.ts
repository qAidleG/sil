interface GrokResponse {
  content: string;
}

interface FluxResponse {
  image_url: string;
}

export async function sendGrokMessage(message: string, apiKey: string): Promise<GrokResponse> {
  const response = await fetch('https://api.x.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt_template: "Create a detailed character profile for the gacha pull.",
      variables: {
        character_name: message,
        series: "Unknown",
        rarity: "Unknown"
      },
      output_format: "json",
      fields: {
        profile_bio: "[Generated Bio]",
        traits: "[Generated Personality Traits]",
        dialog_samples: ["Dialog 1"]
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message to Grok');
  }

  return response.json();
}

export async function generateImage(prompt: string, apiKey: string): Promise<FluxResponse> {
  const response = await fetch('https://api.bfl.ai/v1/generate_image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt_template: "Generate artwork for [Character Name] in [Room Name].",
      variables: {
        character_name: prompt,
        series: "Unknown",
        room_name: "Default Room",
        art_style_instructions: "Modern, high-quality digital art style"
      },
      output_format: "image_url"
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image with Flux');
  }

  return response.json();
} 