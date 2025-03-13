// src/lib/utils/sm2-utils.ts
import { useSM2FlashcardStore } from '@/store/sm2-flashcard-store';
import { useFlashcardStore } from '@/store/flashcard-store';
import { v4 as uuidv4 } from 'uuid';

/**
 * Calculate retention metrics for SM2 flashcards
 * @returns Object containing metrics for retention rate, average interval, etc.
 */
export function calculateRetentionMetrics() {
  const sm2Cards = useSM2FlashcardStore.getState().flashcards;
  
  // If no cards, return default metrics
  if (sm2Cards.length === 0) {
    return {
      retentionRate: 0,
      averageInterval: 0,
      averageEaseFactor: 2.5,
      matureCardCount: 0,
      matureCardPercentage: 0
    };
  }
  
  // Calculate mature cards (cards with interval >= 21 days)
  const matureCards = sm2Cards.filter(card => card.interval >= 21);
  
  // Calculate retention rate
  const learnedCards = sm2Cards.filter(card => card.status !== 'new');
  const successfulCards = sm2Cards.filter(card => card.repetitions > 0);
  const retentionRate = learnedCards.length > 0 
    ? (successfulCards.length / learnedCards.length) * 100 
    : 0;
  
  // Calculate average interval
  const avgInterval = learnedCards.length > 0
    ? learnedCards.reduce((sum, card) => sum + card.interval, 0) / learnedCards.length
    : 0;
  
  // Calculate average ease factor
  const avgEaseFactor = sm2Cards.length > 0
    ? sm2Cards.reduce((sum, card) => sum + card.easeFactor, 0) / sm2Cards.length
    : 2.5;
  
  return {
    retentionRate: Math.round(retentionRate),
    averageInterval: Math.round(avgInterval * 10) / 10, // Round to 1 decimal place
    averageEaseFactor: Math.round(avgEaseFactor * 100) / 100, // Round to 2 decimal places
    matureCardCount: matureCards.length,
    matureCardPercentage: sm2Cards.length > 0 
      ? Math.round((matureCards.length / sm2Cards.length) * 100) 
      : 0
  };
}

/**
 * Calculate a forecast of cards due for review per day for the next week
 * @returns Array of objects with date and count of cards due that day
 */
export function getWeeklyReviewForecast() {
  const sm2Cards = useSM2FlashcardStore.getState().flashcards;
  const forecast = [];
  
  // Create forecast for the next 7 days
  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);
    forecastDate.setHours(0, 0, 0, 0); // Start of day
    
    const nextDay = new Date(forecastDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Count cards due on this day
    const dueCards = sm2Cards.filter(card => {
      const reviewDate = new Date(card.nextReview);
      return reviewDate >= forecastDate && reviewDate < nextDay;
    });
    
    forecast.push({
      date: forecastDate,
      dueCount: dueCards.length
    });
  }
  
  return forecast;
}

/**
 * Migrate flashcards from the regular store to the SM2 store
 * @returns Object with counts of migrated and skipped cards
 */
export function migrateToSM2Store() {
  const flashcardStore = useFlashcardStore.getState();
  const sm2Store = useSM2FlashcardStore.getState();
  
  const flashcards = flashcardStore.flashcards;
  const existingSM2Ids = new Set(sm2Store.flashcards.map(card => card.id));
  
  let migrated = 0;
  let skipped = 0;
  
  // Process each flashcard
  flashcards.forEach(card => {
    // Skip if card already exists in SM2 store
    if (existingSM2Ids.has(card.id)) {
      skipped++;
      return;
    }
    
    // Map status
    let status: 'new' | 'learning' | 'review' = 'new';
    if (card.status) {
      status = card.status;
    } else if (card.interval > 0) {
      status = card.interval > 7 ? 'review' : 'learning';
    }
    
    // Create SM2 card
    const newCardId = sm2Store.addFlashcard(
      card.front,
      card.back,
      card.deck || 'Default',
      card.tags || []
    );
    
    // Update with existing data if available
    if (card.interval || card.easeFactor || card.lastReviewed) {
      sm2Store.updateFlashcard(newCardId, {
        interval: card.interval || 0,
        easeFactor: card.easeFactor || 2.5,
        repetitions: card.reviewCount || 0,
        lastReviewed: card.lastReviewed || null,
        nextReview: card.nextReview || new Date(),
        status: status
      });
    }
    
    migrated++;
  });
  
  return { migrated, skipped };
}