import { Character, EnrichedCharacter } from '@/types/database'

// Helper function to get image URL safely
export function getImageUrl(character: Character | EnrichedCharacter, imageNumber: number): string | undefined {
  switch (imageNumber) {
    case 1: return character.image1url;
    case 2: return character.image2url;
    case 3: return character.image3url;
    case 4: return character.image4url;
    case 5: return character.image5url;
    case 6: return character.image6url;
    default: return character.image1url;
  }
}

// Helper function to check if character has any images
export function hasImages(character: Character | EnrichedCharacter): boolean {
  return !!(
    character.image1url ||
    character.image2url ||
    character.image3url ||
    character.image4url ||
    character.image5url ||
    character.image6url
  );
} 