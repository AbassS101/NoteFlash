// src/lib/utils/sm2-utils.ts

import { useFlashcardStore } from '@/store/flashcard-store';
import { useSM2FlashcardStore, SM2Quality } from '@/store/sm2-flashcard-store';

/**
 * Helper function to migrate flashcards from the existing store to the SM-2 store
 */
export function migrateToSM2Store(): { migrated: number, skipped: number } {
  const { flashcards } = useFlashcardStore.getState();
  const { flashcards: sm2Flashcards, addFlashcard, updateFlashcard } = useSM2FlashcardStore.getState();
  
  let migrated = 0;
  let skipped = 0;
  
  // Check which flashcards already exist in SM-2 store
  const existingIds = new Set(sm2Flashcards.map(card => card.id));
  
  for (const card of flashcards) {
    if (existingIds.has(card.id)) {
      skipped++;
      continue;
    }
    
    // Add the flashcard to the SM-2 store
    const id = addFlashcard(
      card.front,
      card.back,
      card.deck,
      card.tags || []
    );
    
    // If we want to preserve review history, update with the existing values
    if (card.reviewCount > 0) {
      // Convert existing properties to SM-2 equivalents
      updateFlashcard(id, {
        interval: card.interval,
        easeFactor: card.easeFactor,
        repetitions: mapReviewCountToRepetitions(card),
        lastReviewed: card.lastReviewed || null,
        nextReview: card.nextReview,
        status: card.status,
      });
    }
    
    migrated++;
  }
  
  return { migrated, skipped };
}

/**
 * Maps the existing reviewCount to SM-2's repetitions value
 */
function mapReviewCountToRepetitions(card: any): number {
  // Simple mapping based on status and reviewCount
  // In SM-2, repetitions count is reset when card is forgotten
  if (card.status === 'new') {
    return 0;
  } else if (card.status === 'learning') {
    // For learning cards, use a value between 1-2
    return card.reviewCount > 0 ? Math.min(card.reviewCount, 2) : 1;
  } else if (card.status === 'review') {
    // For review cards, use at least 3
    return Math.max(3, card.reviewCount);
  }
  
  return card.reviewCount;
}

/**
 * Converts a flashcard quality rating (0-5) to appropriate user feedback
 */
export function getQualityFeedback(quality: SM2Quality): string {
  switch (quality) {
    case 0:
    case 1:
      return "You'll see this card again very soon";
    case 2:
      return "This card was difficult - you'll review it again soon";
    case 3:
      return "Good job! You'll see this card again in a few days";
    case 4:
      return "Nice work! You've got a good grasp of this card";
    case 5:
      return "Perfect recall! This card is becoming well-known";
    default:
      return "Card has been reviewed";
  }
}

/**
 * Gets flashcards due for review in the next N days
 */
export function getDueFlashcardsInDays(days: number, deck: string = 'all'): number {
  const { flashcards } = useSM2FlashcardStore.getState();
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return flashcards.filter(card => 
    (deck === 'all' || card.deck === deck) &&
    new Date(card.nextReview) <= futureDate
  ).length;
}

/**
 * Calculates an estimated review schedule for the next week
 * Returns a map of days -> number of cards due
 */
export function getWeeklyReviewForecast(deck: string = 'all'): Map<string, number> {
  const { flashcards } = useSM2FlashcardStore.getState();
  const forecast = new Map<string, number>();
  
  // Initialize the forecast for next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecast.set(date.toISOString().split('T')[0], 0);
  }
  
  // Count cards due on each day
  flashcards.forEach(card => {
    if (deck !== 'all' && card.deck !== deck) return;
    
    const dueDate = new Date(card.nextReview);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Only count cards due in the next 7 days
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 7);
    
    if (dueDate >= today && dueDate < futureLimit) {
      forecast.set(dueDateStr, (forecast.get(dueDateStr) || 0) + 1);
    }
  });
  
  return forecast;
}

/**
 * Calculate retention metrics for SM-2 flashcards
 */
export function calculateRetentionMetrics() {
  const { flashcards } = useSM2FlashcardStore.getState();
  
  // No flashcards case
  if (flashcards.length === 0) {
    return {
      maturityRate: 0,
      averageEaseFactor: 2.5,
      averageInterval: 0,
      totalReviews: 0
    };
  }
  
  // Count mature cards (interval >= 21 days)
  const matureCards = flashcards.filter(card => card.status === 'review' && card.interval >= 21).length;
  const maturityRate = (matureCards / flashcards.length) * 100;
  
  // Calculate average ease factor
  const totalEaseFactor = flashcards.reduce((sum, card) => sum + card.easeFactor, 0);
  const averageEaseFactor = totalEaseFactor / flashcards.length;
  
  // Calculate average interval
  const totalInterval = flashcards.reduce((sum, card) => sum + card.interval, 0);
  const averageInterval = totalInterval / flashcards.length;
  
  // Calculate total reviews
  const totalReviews = flashcards.reduce((sum, card) => sum + (card.repetitions || 0), 0);
  
  return {
    maturityRate,
    averageEaseFactor,
    averageInterval,
    totalReviews
  };
}