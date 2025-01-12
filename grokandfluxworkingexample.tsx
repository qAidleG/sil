{
    "instructions": {
      "api": "Grok-2-1212",
      "method": "POST",
      "endpoint": "https://api.x.ai/v1/generate",
      "payload": {
        "prompt_template": "Create a detailed character profile for the gacha pull.",
        "variables": {
          "character_name": "[Character Name]",
          "series": "[Character Series]",
          "rarity": "[Character Rarity]"
        },
        "output_format": "json",
        "fields": {
          "profile_bio": "[Generated Bio]",
          "traits": "[Generated Personality Traits]",
          "dialog_samples": [
            "Dialog 1"
          ]
        }
      },
      "response_handling": {
        "success": "Save generated bio, traits, and dialogs into the character entry in the roster.",
        "error": "Log error and display fallback profile data."
      }
    },
    "image_generation": {
      "api": "Flux Pro 1.1",
      "method": "POST",
      "endpoint": "https://api.bfl.ai/v1/generate_image",
      "payload": {
        "prompt_template": "Generate artwork for [Character Name] in [Room Name].",
        "variables": {
          "character_name": "[Character Name]",
          "series": "[Character Series]",
          "room_name": "[Room Name]",
          "art_style_instructions": "Refer to the dynamically updated flux_artstyle_prompt file for consistent parameters."
        },
        "output_format": "image_url"
      },
      "response_handling": {
        "success": "Save generated image URL into the character's defaultPhotos array or add it as a new scene-specific photo in the roster.",
        "error": "Log error and use fallback image."
      }
    }
  }