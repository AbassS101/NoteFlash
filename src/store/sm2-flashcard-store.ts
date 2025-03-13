// src/store/sm2-flashcard-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the quality types directly mapped to SM-2 values
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Define user-facing rating levels
export type RatingLevel = 'again' | 'hard' | 'good' | 'easy';

// Map rating levels to SM-2 quality values (0-5 scale)
export const RATING_TO_QUALITY: Record<RatingLevel, SM2Quality> = {
  'again': 1, // Complete blackout/forgot
  'hard': 2,  // Incorrect response but recognized answer
  'good': 3,  // Correct with difficulty
  'easy': 5   // Perfect response
};

// SM-2 Flashcard interface
interface SM2Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  created: Date;
  lastReviewed: Date | null;
  nextReview: Date;
  interval: number;      // days until next review
  easeFactor: number;    // starts at 2.5, minimum 1.3
  repetitions: number;   // consecutive correct reviews (n)
  status: 'new' | 'learning' | 'review';
  tags: string[];
}

interface SM2FlashcardState {
  flashcards: SM2Flashcard[];
  currentReviewDeck: string;
  newCardsPerDay: number;
  isLoading: boolean;
  error: string | null;
  
  // Core flashcard functions
  addFlashcard: (front: string, back: string, deck?: string, tags?: string[]) => string;
  updateFlashcard: (id: string, data: Partial<SM2Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  reviewFlashcard: (id: string, quality: SM2Quality) => void;
  
  // Get flashcards for review
  getDueFlashcards: (deck?: string, limit?: number) => SM2Flashcard[];
  getNewFlashcards: (deck?: string, limit?: number) => SM2Flashcard[];
  
  // Configuration
  setNewCardsPerDay: (count: number) => void;
  setCurrentReviewDeck: (deck: string) => void;
  fetchFlashcards: () => Promise<void>;
}

export const useSM2FlashcardStore = create<SM2FlashcardState>()(
  persist(
    (set, get) => ({
      flashcards: [],
      currentReviewDeck: 'all',
      newCardsPerDay: 20,
      isLoading: false,
      error: null,
      
      addFlashcard: (front, back, deck = 'Default', tags = []) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        const newFlashcard: SM2Flashcard = {
          id,
          front,
          back,
          deck,
          created: new Date(),
          lastReviewed: null,
          nextReview: new Date(), // Due immediately
          interval: 0,
          easeFactor: 2.5, // Default ease factor from SM-2
          repetitions: 0,
          status: 'new',
          tags: tags
        };
        
        set(state => ({ 
          flashcards: [...state.flashcards, newFlashcard]
        }));
        
        return id;
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
       * Strict SM-2 algorithm implementation
       * @param id Flashcard ID
       * @param quality Rating 0-5 where:
       *   0,1 = complete blackout/failure
       *   2 = incorrect but recognized
       *   3 = correct with difficulty
       *   4 = correct with hesitation
       *   5 = perfect recall
       */
      reviewFlashcard: (id, quality) => {
        const { flashcards } = get();
        const cardIndex = flashcards.findIndex(card => card.id === id);
        
        if (cardIndex === -1) return;
        
        const card = flashcards[cardIndex];
        
        // Calculate new ease factor - exact SM-2 formula
        const newEaseFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        
        let newRepetitions: number;
        let newInterval: number;
        let newStatus: 'new' | 'learning' | 'review' = card.status;
        
        // Handle rating based on exact SM-2 algorithm
        if (quality < 3) {
          // If quality < 3, the card was forgotten
          newRepetitions = 0;
          newInterval = 1; // Set interval to 1 day
          newStatus = 'learning';
        } else {
          // Increase repetition counter
          newRepetitions = card.repetitions + 1;
          
          // Calculate new interval based on repetition count
          if (newRepetitions === 1) {
            newInterval = 1; // First successful review: 1 day
          } else if (newRepetitions === 2) {
            newInterval = 6; // Second successful review: 6 days
          } else {
            // For subsequent reviews: previous interval * ease factor
            newInterval = Math.round(card.interval * newEaseFactor);
            newStatus = 'review';
          }
        }
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        
        // Update the flashcard
        const updatedFlashcards = [...flashcards];
        updatedFlashcards[cardIndex] = {
          ...card,
          interval: newInterval,
          easeFactor: newEaseFactor,
          repetitions: newRepetitions,
          lastReviewed: new Date(),
          nextReview: nextReviewDate,
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
      
      setNewCardsPerDay: (count) => {
        set({ newCardsPerDay: count });
      },
      
      setCurrentReviewDeck: (deck) => {
        set({ currentReviewDeck: deck });
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
      name: 'noteflash-sm2-flashcards',
      partialize: (state) => ({ 
        flashcards: state.flashcards,
        newCardsPerDay: state.newCardsPerDay,
        currentReviewDeck: state.currentReviewDeck
      }),
    }
  )
);