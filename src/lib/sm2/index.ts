/**
 * SuperMemo 2 (SM-2) algorithm implementation for spaced repetition
 * Based on the algorithm described by Piotr Wozniak
 * 
 * This file provides core SM-2 functionality for flashcard reviews
 */

// Quality rating for SM-2 algorithm
export enum SM2Quality {
    AGAIN = 0,  // Complete blackout, need to relearn
    HARD = 1,   // Incorrect response, but upon seeing answer, it felt familiar
    GOOD = 2,   // Correct response, but with difficulty
    FAIR = 3,   // Correct response after hesitation
    EASY = 4,   // Correct response with perfect recall
    PERFECT = 5 // Correct response that felt natural and effortless
  }
  
  // Flashcard learning status
  export type FlashcardStatus = 'new' | 'learning' | 'review' | 'relearning';
  
  // Interface for SM-2 flashcard data
  export interface SM2FlashcardData {
    id: string;
    front: string;
    back: string;
    deck: string;
    tags: string[];
    
    // SM-2 specific properties
    interval: number;          // Current interval in days
    easeFactor: number;        // Ease factor (multiplier for intervals)
    repetitions: number;       // Number of successful repetitions in a row
    lastReviewed: Date | null; // Last review date
    nextReview: Date;          // Next scheduled review date
    status: FlashcardStatus;   // Current learning status
  }
  
  /**
   * Default values for new flashcards following SM-2 algorithm
   */
  export const SM2_DEFAULTS = {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    status: 'new' as FlashcardStatus
  };
  
  /**
   * Initial intervals (in days) for each step of the learning phase
   */
  export const LEARNING_STEPS = [1/1440, 10/1440, 1]; // 1min, 10min, 1day
  
  /**
   * Initial intervals (in days) for the relearning phase
   */
  export const RELEARNING_STEPS = [10/1440, 1]; // 10min, 1day
  
  /**
   * Calculate next review date based on SM-2 algorithm
   * 
   * @param flashcard - The flashcard being reviewed
   * @param quality - Quality of the response (0-5)
   * @returns Updated flashcard data with new interval, ease factor, etc.
   */
  export function calculateNextReview(
    flashcard: SM2FlashcardData, 
    quality: SM2Quality
  ): Partial<SM2FlashcardData> {
    const result: Partial<SM2FlashcardData> = {
      lastReviewed: new Date()
    };
    
    // Clone the flashcard data to work with
    const card = { ...flashcard };
    
    // Handle response based on current status and quality
    if (card.status === 'new') {
      // New cards enter the learning phase
      result.status = 'learning';
      result.repetitions = 0;
      
      // Use the first learning step
      const firstStep = LEARNING_STEPS[0];
      result.interval = firstStep;
      
      // Set next review date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + firstStep);
      nextDate.setHours(nextDate.getHours() + firstStep * 24);
      result.nextReview = nextDate;
      
      return result;
    }
    
    if (card.status === 'learning') {
      if (quality >= SM2Quality.FAIR) { // Successful recall
        // Move to next learning step
        const currentStep = LEARNING_STEPS.indexOf(card.interval);
        const nextStep = currentStep + 1;
        
        if (nextStep >= LEARNING_STEPS.length) {
          // Graduated from learning - move to review
          result.status = 'review';
          result.repetitions = 1;
          result.interval = 1; // Start with 1 day interval
        } else {
          // Still in learning phase
          result.interval = LEARNING_STEPS[nextStep];
        }
      } else { // Failed recall
        // Reset to first learning step
        result.interval = LEARNING_STEPS[0];
      }
      
      // Set next review date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + result.interval);
      nextDate.setHours(nextDate.getHours() + result.interval * 24);
      result.nextReview = nextDate;
      
      return result;
    }
    
    if (card.status === 'review') {
      // Classic SM-2 algorithm for review cards
      if (quality >= SM2Quality.FAIR) { // Successful recall
        // Update ease factor
        result.easeFactor = Math.max(
          1.3, // Minimum ease factor
          card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );
        
        // Update repetition count
        result.repetitions = card.repetitions + 1;
        
        // Calculate new interval
        if (card.repetitions === 0) {
          result.interval = 1;
        } else if (card.repetitions === 1) {
          result.interval = 6;
        } else {
          result.interval = Math.round(card.interval * card.easeFactor);
        }
      } else { // Failed recall
        // Card needs to be relearned
        result.status = 'relearning';
        result.repetitions = 0;
        result.interval = RELEARNING_STEPS[0];
        
        // Decrease ease factor
        result.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
      }
      
      // Set next review date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + result.interval);
      result.nextReview = nextDate;
      
      return result;
    }
    
    if (card.status === 'relearning') {
      if (quality >= SM2Quality.FAIR) { // Successful recall
        // Move to next relearning step
        const currentStep = RELEARNING_STEPS.indexOf(card.interval);
        const nextStep = currentStep + 1;
        
        if (nextStep >= RELEARNING_STEPS.length) {
          // Graduated from relearning - back to review
          result.status = 'review';
          result.repetitions = 1; // Start over
          result.interval = 1; // Start with 1 day interval
        } else {
          // Still in relearning phase
          result.interval = RELEARNING_STEPS[nextStep];
        }
      } else { // Failed recall
        // Reset to first relearning step
        result.interval = RELEARNING_STEPS[0];
      }
      
      // Set next review date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + result.interval);
      nextDate.setHours(nextDate.getHours() + result.interval * 24);
      result.nextReview = nextDate;
      
      return result;
    }
    
    // Fallback for any unexpected state
    return result;
  }
  
  /**
   * Determines if a flashcard is due for review
   * 
   * @param flashcard - The flashcard to check
   * @returns boolean indicating if the card is due for review
   */
  export function isFlashcardDue(flashcard: SM2FlashcardData): boolean {
    const now = new Date();
    return now >= new Date(flashcard.nextReview);
  }
  
  /**
   * Creates a new flashcard with default SM-2 values
   * 
   * @param front - Front side content
   * @param back - Back side content
   * @param deck - Deck name
   * @param tags - Array of tags
   * @returns New flashcard object with SM-2 defaults
   */
  export function createNewFlashcard(
    id: string,
    front: string,
    back: string,
    deck: string,
    tags: string[] = []
  ): SM2FlashcardData {
    const now = new Date();
    
    return {
      id,
      front,
      back,
      deck,
      tags,
      interval: SM2_DEFAULTS.interval,
      easeFactor: SM2_DEFAULTS.easeFactor,
      repetitions: SM2_DEFAULTS.repetitions,
      lastReviewed: null,
      nextReview: now, // Due immediately
      status: SM2_DEFAULTS.status
    };
  }
  
  /**
   * Generate a string representation of when a card will be reviewed next
   * 
   * @param flashcard - The flashcard to check
   * @returns Human-readable string for next review date
   */
  export function getNextReviewText(flashcard: SM2FlashcardData): string {
    const now = new Date();
    const nextReview = new Date(flashcard.nextReview);
    
    // If due now
    if (nextReview <= now) {
      return "Due now";
    }
    
    // Calculate difference in days
    const diffTime = Math.abs(nextReview.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Calculate difference in hours
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        // Calculate difference in minutes
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        return `Due in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      }
      return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Due in ${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Due in ${months} month${months !== 1 ? 's' : ''}`;
    }
  }
  
  /**
   * Format a quality rating as descriptive text
   * 
   * @param quality - SM2Quality value
   * @returns Human-readable description of the quality rating
   */
  export function formatQualityRating(quality: SM2Quality): string {
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