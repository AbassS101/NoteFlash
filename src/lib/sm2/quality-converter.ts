import { SM2Quality } from './index';

/**
 * Safely converts a numeric quality rating to the SM2Quality enum type
 * Use this when you have a numeric value but need to pass it to functions
 * that expect the SM2Quality enum type
 */
export function toSM2Quality(numericQuality: number): SM2Quality {
  // Make sure the number is an integer within valid range (0-5)
  const safeQuality = Math.max(0, Math.min(5, Math.floor(numericQuality)));
  
  // Cast the number to the SM2Quality enum type
  return safeQuality as SM2Quality;
}

/**
 * Maps quality ratings to descriptive labels
 */
export function getQualityLabel(quality: SM2Quality): string {
  switch (quality) {
    case SM2Quality.AGAIN:
      return "Again";
    case SM2Quality.HARD:
      return "Hard";
    case SM2Quality.GOOD:
      return "Good";
    case SM2Quality.FAIR:
      return "Fair";
    case SM2Quality.EASY:
      return "Easy";
    case SM2Quality.PERFECT:
      return "Perfect";
    default:
      return "Unknown";
  }
}

/**
 * Converts a quality rating to a descriptive feedback message
 */
export function getQualityFeedback(quality: SM2Quality): string {
  switch (quality) {
    case SM2Quality.AGAIN:
      return "You'll see this card again very soon";
    case SM2Quality.HARD:
      return "This card was difficult - you'll review it again soon";
    case SM2Quality.GOOD:
      return "Good job! You remembered this card";
    case SM2Quality.FAIR:
      return "You'll see this card again in a few days";
    case SM2Quality.EASY:
      return "Nice work! You've got a good grasp of this card";
    case SM2Quality.PERFECT:
      return "Perfect recall! This card is becoming well-known";
    default:
      return "Card has been reviewed";
  }
}