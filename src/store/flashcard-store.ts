// src/store/flashcard-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  status: 'new' | 'learning' | 'review'; // Track card status
}

interface FlashcardState {
  flashcards: Flashcard[];
  currentReviewIndex: number;
  isLoading: boolean;
  error: string | null;
  newCardsPerDay: number; // How many new cards to introduce per day
  
  addFlashcard: (front: string, back: string, deck?: string) => string; // Returns the ID
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  reviewFlashcard: (id: string, quality: number) => void;
  getDueFlashcards: (deck?: string, limit?: number) => Flashcard[];
  getNewFlashcards: (deck?: string, limit?: number) => Flashcard[];
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
  batchAddFlashcards: (pairs: {front: string, back: string}[], deck: string) => string[];
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      flashcards: [],
      currentReviewIndex: 0,
      isLoading: false,
      error: null,
      newCardsPerDay: 20, // Default to 20 new cards per day
      
      addFlashcard: (front, back, deck = 'Default') => {
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
          easeFactor: 2.5,
          reviewCount: 0,
          status: 'new', // All cards start as new
        };
        
        set(state => ({ 
          flashcards: [...state.flashcards, newFlashcard]
        }));
        
        return id; // Return the ID for reference
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
            status: 'new' as const, // Add explicit type assertion
          };
        });
        
        set(state => ({
          flashcards: [...state.flashcards, ...newFlashcards]
        }));
        
        return newIds;
      },
      
      setNewCardsPerDay: (count) => {
        set({ newCardsPerDay: count });
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
      
      reviewFlashcard: (id, quality) => {
        const { flashcards } = get();
        const cardIndex = flashcards.findIndex(card => card.id === id);
        
        if (cardIndex === -1) return;
        
        const card = flashcards[cardIndex];
        let newInterval: number, newEaseFactor: number;
        let newStatus: 'new' | 'learning' | 'review' = card.status;
        
        // SM-2 algorithm implementation
        // 0 = again, 1 = hard, 3 = good, 5 = easy
        if (quality < 3) {
          if (quality === 0) {
            // Again - reset interval (relearn)
            newInterval = 0; 
            // Card goes/stays in learning state if rated "again"
            newStatus = 'learning';
          } else {
            // Hard - shorter interval than normal
            newInterval = Math.max(1, Math.round(card.interval * 0.6));
            
            // If card is new and first seen, move to learning
            if (card.status === 'new') {
              newStatus = 'learning';
            }
          }
          // Reduce ease factor for difficult cards
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
        } else {
          // Calculate ease factor adjustment
          if (quality === 3) {
            // Good - keep ease factor the same
            newEaseFactor = card.easeFactor;
          } else {
            // Easy - increase ease factor
            newEaseFactor = Math.min(2.5, card.easeFactor + 0.15);
          }
          
          // Calculate interval
          if (card.status === 'new' || card.interval === 0) {
            // First review of a new card
            newInterval = 1;
            newStatus = 'learning';
          } else if (card.status === 'learning' || card.interval === 1) {
            // Second review - card in learning phase
            newInterval = quality === 3 ? 3 : 4; // 3 days for "good", 4 for "easy"
            // If card does well in learning, graduate to review
            newStatus = 'review';
          } else {
            // Card in review phase - use standard SM-2 algorithm
            const intervalMultiplier = quality === 3 ? 1 : 1.3; // Easier cards get longer intervals
            newInterval = Math.round(card.interval * newEaseFactor * intervalMultiplier);
            
            // Cap maximum interval at 180 days (6 months)
            newInterval = Math.min(newInterval, 180);
          }
        }
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        
        const updatedFlashcards = [...flashcards];
        updatedFlashcards[cardIndex] = {
          ...card,
          interval: newInterval,
          easeFactor: newEaseFactor,
          nextReview: nextReviewDate,
          lastReviewed: new Date(),
          reviewCount: card.reviewCount + 1,
          status: newStatus
        };
        
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
        
        if (limit > 0 && dueCards.length > limit) {
          return dueCards.slice(0, limit);
        }
        
        return dueCards;
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
      
      getNextReviewCard: () => {
        const dueCards = get().getDueFlashcards();
        let { currentReviewIndex } = get();
        
        if (dueCards.length === 0) {
          return null;
        }
        
        if (currentReviewIndex >= dueCards.length) {
          currentReviewIndex = 0;
          set({ currentReviewIndex });
        }
        
        const card = dueCards[currentReviewIndex];
        set({ currentReviewIndex: currentReviewIndex + 1 });
        
        return card;
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
        currentReviewIndex: state.currentReviewIndex 
      }),
    }
  )
);