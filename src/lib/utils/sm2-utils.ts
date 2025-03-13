// src/lib/utils/sm2-utils.ts
// SM2 algorithm implementation for flashcard spaced repetition

// Make sure all enum declarations are consistent (all exported)
export enum SM2Quality {
    COMPLETELY_WRONG = 0,
    WRONG_BUT_FAMILIAR = 1,
    WRONG_BUT_EASY_TO_RECALL = 2,
    CORRECT_BUT_DIFFICULT = 3,
    CORRECT_WITH_HESITATION = 4,
    CORRECT_AND_EASY = 5
  }
  
  // Interface for SM2 card parameters
  export interface SM2CardParams {
    easinessFactor: number;
    repetitions: number;
    interval: number;
    dueDate?: Date;
    lastReviewed?: Date;
  }
  
  // Calculate next review date for a card based on the quality of response
  export function calculateNextReview(card: SM2CardParams, quality: SM2Quality): SM2CardParams {
    // Make sure quality is in valid range 0-5
    quality = Math.max(0, Math.min(5, quality)) as SM2Quality;
  
    // Deep copy the card parameters to avoid mutating the original
    const newParams: SM2CardParams = {
      ...card,
      lastReviewed: new Date()
    };
    
    // Apply SM2 algorithm
    
    // If quality < 3, start repetitions from the beginning
    if (quality < SM2Quality.CORRECT_BUT_DIFFICULT) {
      newParams.repetitions = 0;
      newParams.interval = 1; // Review again in 1 day
    } else {
      // Calculate the next interval
      if (newParams.repetitions === 0) {
        newParams.interval = 1; // First successful review: 1 day
      } else if (newParams.repetitions === 1) {
        newParams.interval = 6; // Second successful review: 6 days
      } else {
        // Third or more successful review: interval * easiness factor
        newParams.interval = Math.round(newParams.interval * newParams.easinessFactor);
      }
      
      // Increment repetition counter
      newParams.repetitions += 1;
    }
    
    // Update easiness factor
    newParams.easinessFactor = Math.max(
      1.3, // Minimum easiness factor
      newParams.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newParams.interval);
    newParams.dueDate = dueDate;
    
    return newParams;
  }
  
  // Reset a card's SM2 parameters
  export function resetCardProgress(card: SM2CardParams): SM2CardParams {
    return {
      easinessFactor: 2.5, // Default easiness factor
      repetitions: 0,
      interval: 0,
      lastReviewed: undefined,
      dueDate: undefined
    };
  }
  
  // Check if a card is due for review
  export function isCardDue(card: SM2CardParams): boolean {
    if (!card.dueDate) {
      return true; // Card has never been reviewed
    }
    
    const now = new Date();
    return card.dueDate <= now;
  }
  
  // Calculate retention rate based on easiness factor and repetitions
  export function calculateRetentionRate(cards: SM2CardParams[]): number {
    if (cards.length === 0) return 0;
    
    // Calculate avg easiness factor, then transform to approximate retention rate
    const avgEasinessFactor = cards.reduce((sum, card) => sum + card.easinessFactor, 0) / cards.length;
    
    // Rough approximation: EF 2.5 = ~85% retention, EF 1.3 = ~60% retention, linear scale
    const retentionRate = Math.min(95, Math.max(50, (avgEasinessFactor - 1.3) / 1.2 * 25 + 60));
    
    return Math.round(retentionRate);
  }
  
  // Get cards that are due for review
  export function getDueCards(cards: SM2CardParams[]): SM2CardParams[] {
    return cards.filter(isCardDue);
  }
  
  // Sort cards by priority for review (overdue first, then by interval)
  export function sortCardsByReviewPriority(cards: SM2CardParams[]): SM2CardParams[] {
    return [...cards].sort((a, b) => {
      // First check if cards are due
      const aIsDue = isCardDue(a);
      const bIsDue = isCardDue(b);
      
      if (aIsDue && !bIsDue) return -1;
      if (!aIsDue && bIsDue) return 1;
      
      // If both are due (or both not due), sort by interval (shorter interval first)
      return a.interval - b.interval;
    });
  }