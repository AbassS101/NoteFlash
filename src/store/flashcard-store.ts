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
}

interface FlashcardState {
  flashcards: Flashcard[];
  currentReviewIndex: number;
  isLoading: boolean;
  error: string | null;
  
  addFlashcard: (front: string, back: string, deck?: string) => string; // Now returns the ID
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  reviewFlashcard: (id: string, quality: number) => void;
  getDueFlashcards: (deck?: string, limit?: number) => Flashcard[];
  getNextReviewCard: () => Flashcard | null;
  getReviewStats: () => { total: number; dueToday: number; reviewedToday: number; remaining: number };
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
      
      reviewFlashcard: (id, quality) => {
        const { flashcards } = get();
        const cardIndex = flashcards.findIndex(card => card.id === id);
        
        if (cardIndex === -1) return;
        
        const card = flashcards[cardIndex];
        let newInterval, newEaseFactor;
        
        // SM-2 algorithm implementation
        if (quality < 3) {
          newInterval = 1;
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
        } else {
          newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
          
          if (card.interval === 0) {
            newInterval = 1;
          } else if (card.interval === 1) {
            newInterval = 6;
          } else {
            newInterval = Math.round(card.interval * newEaseFactor);
          }
        }
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        
        const updatedFlashcards = [...flashcards];
        updatedFlashcards[cardIndex] = {
          ...card,
          interval: newInterval,
          easeFactor: Math.max(1.3, newEaseFactor),
          nextReview: nextReviewDate,
          lastReviewed: new Date(),
          reviewCount: card.reviewCount + 1
        };
        
        set({ flashcards: updatedFlashcards });
      },
      
      getDueFlashcards: (deck = 'all', limit = 0) => {
        const now = new Date();
        const { flashcards } = get();
        
        const dueCards = flashcards.filter(card => 
          (deck === 'all' || card.deck === deck) && 
          now >= new Date(card.nextReview)
        );
        
        if (limit > 0 && dueCards.length > limit) {
          return dueCards.slice(0, limit);
        }
        
        return dueCards;
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
        const { flashcards } = get();
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        
        const total = flashcards.length;
        const dueToday = flashcards.filter(card => new Date(card.nextReview) <= now).length;
        
        const reviewedToday = flashcards.filter(card => {
          return card.lastReviewed && new Date(card.lastReviewed) >= today;
        }).length;
        
        return {
          total,
          dueToday,
          reviewedToday,
          remaining: dueToday - reviewedToday
        };
      },
      
      fetchFlashcards: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // For now, we'll rely on the persisted state
          // const response = await fetch('/api/flashcards');
          // const flashcards = await response.json();
          // set({ flashcards, isLoading: false });
          
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