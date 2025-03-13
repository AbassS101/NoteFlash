// src/store/flashcard-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define rating types for the new 3-level system
export type RatingLevel = 'hard' | 'normal' | 'easy';

// Map numeric quality to rating levels
export const mapQualityToRating = (quality: number): RatingLevel => {
  if (quality <= 1) return 'hard';
  if (quality === 3) return 'normal';
  return 'easy'; // 4-5
};

// Enhanced flashcard interface with related cards
interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  created: Date;
  lastReviewed: Date | null;
  nextReview: Date;
  interval: number;
  easeFactor: number;
  reviewCount: number;
  status: 'new' | 'learning' | 'review';
  relatedCardIds: string[]; // New field for context-aware spacing
  tags: string[]; // New field for identifying related content
  lastRating: RatingLevel | null; // Track the last rating for analysis
  consecutiveCorrect: number; // Track consecutive correct answers
}

interface FlashcardState {
  flashcards: Flashcard[];
  currentReviewIndex: number;
  isLoading: boolean;
  error: string | null;
  newCardsPerDay: number;
  
  // Core flashcard functions
  addFlashcard: (front: string, back: string, deck?: string, tags?: string[]) => string;
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  reviewFlashcard: (id: string, quality: number) => void;
  
  // Get flashcards for review
  getDueFlashcards: (deck?: string, limit?: number) => Flashcard[];
  getNewFlashcards: (deck?: string, limit?: number) => Flashcard[];
  getRelatedFlashcards: (cardId: string, limit?: number) => Flashcard[];
  
  // Statistics and configuration
  getReviewStats: () => { 
    total: number; 
    dueToday: number; 
    newToday: number; 
    reviewedToday: number; 
    remaining: number;
    newRemaining: number;
  };
  setNewCardsPerDay: (count: number) => void;
  fetchFlashcards: () => Promise<void>;
  batchAddFlashcards: (pairs: {front: string, back: string, tags?: string[]}[], deck: string) => string[];
  linkRelatedCards: (cardId: string, relatedIds: string[]) => void;
}

// Optimized interval multipliers based on rating
const INTERVAL_MULTIPLIERS = {
  hard: 1.2,
  normal: 2.5,
  easy: 4.5
};

// Ease factor adjustments
const EASE_ADJUSTMENTS = {
  hard: -0.15,
  normal: 0,
  easy: 0.1
};

// Initial intervals for new cards (in days)
const INITIAL_INTERVALS = {
  hard: 1,
  normal: 3,
  easy: 5
};

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      flashcards: [],
      currentReviewIndex: 0,
      isLoading: false,
      error: null,
      newCardsPerDay: 20,
      
      addFlashcard: (front, back, deck = 'Default', tags = []) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        const newFlashcard: Flashcard = {
          id,
          front,
          back,
          deck,
          created: new Date(),
          lastReviewed: null,
          nextReview: new Date(), // Due immediately
          interval: 0,
          easeFactor: 2.5, // Default ease factor from SM-2
          reviewCount: 0,
          status: 'new',
          relatedCardIds: [],
          tags: tags,
          lastRating: null,
          consecutiveCorrect: 0
        };
        
        set(state => ({ 
          flashcards: [...state.flashcards, newFlashcard]
        }));
        
        return id;
      },
      
      batchAddFlashcards: (pairs, deck) => {
        const newIds: string[] = [];
        const newFlashcards = pairs.map(pair => {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2) + newIds.length;
          newIds.push(id);
          
          return {
            id,
            front: pair.front,
            back: pair.back,
            deck,
            created: new Date(),
            lastReviewed: null,
            nextReview: new Date(),
            interval: 0,
            easeFactor: 2.5,
            reviewCount: 0,
            status: 'new' as const,
            relatedCardIds: [],
            tags: pair.tags || [],
            lastRating: null,
            consecutiveCorrect: 0
          };
        });
        
        set(state => ({
          flashcards: [...state.flashcards, ...newFlashcards]
        }));
        
        return newIds;
      },
      
      updateFlashcard: (id, data) => {
        set(state => ({
          flashcards: state.flashcards.map(card => 
            card.id === id ? { ...card, ...data } : card
          )
        }));
      },
      
      deleteFlashcard: (id) => {
        set(state => ({
          flashcards: state.flashcards.filter(card => card.id !== id)
        }));
      },
      
      /**
       * Enhanced SM-2 algorithm with adaptive difficulty
       * quality: 0-1 (hard), 3 (normal), 4-5 (easy)
       */
      reviewFlashcard: (id, quality) => {
        const { flashcards } = get();
        const cardIndex = flashcards.findIndex(card => card.id === id);
        
        if (cardIndex === -1) return;
        
        const card = flashcards[cardIndex];
        const rating = mapQualityToRating(quality);
        
        // Calculate new ease factor with improved formula
        // E = max(1.3, E + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02)))
        const easeAdjustment = EASE_ADJUSTMENTS[rating];
        let newEaseFactor = Math.max(1.3, card.easeFactor + easeAdjustment);
        
        // Determine new status and interval
        let newStatus = card.status;
        let newInterval = card.interval;
        let newConsecutiveCorrect = card.consecutiveCorrect;
        
        if (rating === 'hard') {
          // Handle difficult cards
          if (card.status === 'new' || card.interval === 0) {
            newInterval = INITIAL_INTERVALS.hard;
            newStatus = 'learning';
          } else if (card.status === 'review') {
            // For review cards, make the interval shorter but not reset
            newInterval = Math.max(1, Math.round(card.interval * INTERVAL_MULTIPLIERS.hard));
          } else {
            // Learning cards stay at current interval
            newInterval = card.interval;
          }
          newConsecutiveCorrect = 0; // Reset consecutive correct counter
        } else {
          // Handle normal and easy cards
          if (card.status === 'new' || card.interval === 0) {
            // First review of a new card
            newInterval = INITIAL_INTERVALS[rating];
            newStatus = 'learning';
            newConsecutiveCorrect = 1;
          } else if (card.status === 'learning') {
            // Learning cards use initial intervals but progress faster with "easy"
            newInterval = rating === 'easy' ? INITIAL_INTERVALS.easy * 2 : INITIAL_INTERVALS[rating];
            
            // Graduate to review if this is not the first time and rated well
            if (card.reviewCount > 0 && (rating === 'normal' || rating === 'easy')) {
              newStatus = 'review';
            }
            
            newConsecutiveCorrect = rating === 'easy' ? card.consecutiveCorrect + 2 : 
                                    rating === 'normal' ? card.consecutiveCorrect + 1 : 0;
          } else {
            // Card in review phase - use optimized intervals
            const intervalMultiplier = INTERVAL_MULTIPLIERS[rating];
            newInterval = Math.round(card.interval * newEaseFactor * intervalMultiplier / 100) * 100;
            
            // If user consistently rates card as easy, increase interval more aggressively
            if (rating === 'easy' && card.lastRating === 'easy') {
              newInterval = Math.round(newInterval * 1.3);
            }
            
            // Cap maximum interval at 365 days (1 year)
            newInterval = Math.min(newInterval, 365);
            
            newConsecutiveCorrect = rating === 'easy' ? card.consecutiveCorrect + 2 : 
                                    rating === 'normal' ? card.consecutiveCorrect + 1 : 0;
          }
        }
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        
        // Update the card
        const updatedFlashcards = [...flashcards];
        updatedFlashcards[cardIndex] = {
          ...card,
          interval: newInterval,
          easeFactor: newEaseFactor,
          nextReview: nextReviewDate,
          lastReviewed: new Date(),
          reviewCount: card.reviewCount + 1,
          status: newStatus,
          lastRating: rating,
          consecutiveCorrect: newConsecutiveCorrect
        };
        
        // Check if we need to prioritize related cards
        if (rating === 'hard' && card.relatedCardIds.length > 0) {
          // Adjust review dates for related cards to be shown sooner
          card.relatedCardIds.forEach(relatedId => {
            const relatedCardIndex = updatedFlashcards.findIndex(c => c.id === relatedId);
            if (relatedCardIndex !== -1) {
              const relatedCard = updatedFlashcards[relatedCardIndex];
              
              // Only move up cards that aren't already due very soon
              if (relatedCard.nextReview > nextReviewDate) {
                // Calculate a review date that's sooner than originally scheduled
                // but still allows some spacing
                const adjustedDate = new Date();
                adjustedDate.setDate(adjustedDate.getDate() + Math.max(1, Math.floor(newInterval / 2)));
                
                updatedFlashcards[relatedCardIndex] = {
                  ...relatedCard,
                  nextReview: adjustedDate
                };
              }
            }
          });
        }
        
        set({ flashcards: updatedFlashcards });
      },
      
      getDueFlashcards: (deck = 'all', limit = 0) => {
        const now = new Date();
        const { flashcards } = get();
        
        // Get cards that are due for review (not new cards)
        const dueCards = flashcards.filter(card => 
          (deck === 'all' || card.deck === deck) && 
          card.status !== 'new' &&
          now >= new Date(card.nextReview)
        );
        
        // Sort by overdue status (most overdue first)
        const sortedDueCards = dueCards.sort((a, b) => {
          const dateA = new Date(a.nextReview).getTime();
          const dateB = new Date(b.nextReview).getTime();
          return dateA - dateB;
        });
        
        if (limit > 0 && sortedDueCards.length > limit) {
          return sortedDueCards.slice(0, limit);
        }
        
        return sortedDueCards;
      },
      
      getNewFlashcards: (deck = 'all', limit = 0) => {
        const { flashcards, newCardsPerDay } = get();
        
        // Get cards that are new and haven't been studied yet
        const newCards = flashcards.filter(card => 
          (deck === 'all' || card.deck === deck) && 
          card.status === 'new'
        );
        
        // Apply limit (either user-specified or default daily limit)
        const actualLimit = limit > 0 ? limit : newCardsPerDay;
        
        if (actualLimit > 0 && newCards.length > actualLimit) {
          return newCards.slice(0, actualLimit);
        }
        
        return newCards;
      },
      
      // New function: Get related flashcards for context-aware spacing
      getRelatedFlashcards: (cardId, limit = 5) => {
        const { flashcards } = get();
        const card = flashcards.find(c => c.id === cardId);
        
        if (!card) return [];
        
        // Start with directly linked cards
        let relatedCards = card.relatedCardIds
          .map(id => flashcards.find(c => c.id === id))
          .filter(Boolean) as Flashcard[];
        
        // If we don't have enough directly linked cards, find cards with matching tags
        if (relatedCards.length < limit && card.tags.length > 0) {
          const tagRelatedCards = flashcards.filter(c => 
            c.id !== cardId && 
            !card.relatedCardIds.includes(c.id) &&
            c.tags.some(tag => card.tags.includes(tag))
          );
          
          // Add tag-related cards until we reach the limit
          relatedCards = [
            ...relatedCards,
            ...tagRelatedCards.slice(0, limit - relatedCards.length)
          ];
        }
        
        return relatedCards;
      },
      
      // New function: Link related cards
      linkRelatedCards: (cardId, relatedIds) => {
        set(state => ({
          flashcards: state.flashcards.map(card => {
            if (card.id === cardId) {
              // Update the related card IDs, avoiding duplicates
              const existingRelated = new Set(card.relatedCardIds);
              relatedIds.forEach(id => existingRelated.add(id));
              
              return {
                ...card,
                relatedCardIds: Array.from(existingRelated)
              };
            }
            return card;
          })
        }));
      },
      
      setNewCardsPerDay: (count) => {
        set({ newCardsPerDay: count });
      },
      
      getReviewStats: () => {
        const { flashcards, newCardsPerDay } = get();
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        
        const total = flashcards.length;
        
        // Cards due for review (not new)
        const dueToday = flashcards.filter(card => 
          card.status !== 'new' && 
          new Date(card.nextReview) <= now
        ).length;
        
        // New cards available
        const totalNewCards = flashcards.filter(card => card.status === 'new').length;
        const newToday = Math.min(totalNewCards, newCardsPerDay);
        
        // Cards already reviewed today
        const reviewedToday = flashcards.filter(card => {
          return card.lastReviewed && new Date(card.lastReviewed) >= today;
        }).length;
        
        // Get count of new cards studied today
        const newCardsDoneToday = flashcards.filter(card => {
          return card.status !== 'new' && 
                card.reviewCount === 1 && 
                card.lastReviewed && 
                new Date(card.lastReviewed) >= today;
        }).length;
        
        return {
          total,
          dueToday,
          newToday,
          reviewedToday,
          remaining: dueToday - reviewedToday,
          newRemaining: newToday - newCardsDoneToday
        };
      },
      
      fetchFlashcards: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // For now, we'll rely on the persisted state
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch flashcards', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'noteflash-flashcards',
      partialize: (state) => ({ 
        flashcards: state.flashcards,
        currentReviewIndex: state.currentReviewIndex,
        newCardsPerDay: state.newCardsPerDay
      }),
    }
  )
);