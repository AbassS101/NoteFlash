// src/store/flashcard-store.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Flashcard, FlashcardDeck, FlashcardFolder } from '../types/flashcard-types';

// Type for rating levels
export type RatingLevel = 'hard' | 'normal' | 'easy';

interface FlashcardState {
  // Flashcards
  flashcards: Flashcard[];
  addFlashcard: (front: string, back: string, deck?: string, tags?: string[]) => string;
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  
  // Review functions
  reviewFlashcard: (id: string, rating: number) => void;
  getDueFlashcards: (deck?: string) => Flashcard[];
  getNewFlashcards: (deck?: string) => Flashcard[];
  getRelatedFlashcards: (id: string, limit?: number) => Flashcard[];
  newCardsPerDay: number;
  setNewCardsPerDay: (count: number) => void;
  
  // Decks
  decks: FlashcardDeck[];
  addDeck: (name: string, description: string, folderId?: string) => FlashcardDeck;
  updateDeck: (id: string, data: Partial<FlashcardDeck>) => void;
  deleteDeck: (id: string) => void;
  duplicateDeck: (id: string) => FlashcardDeck;
  
  // Folders
  folders: FlashcardFolder[];
  addFolder: (name: string, parentId?: string) => FlashcardFolder;
  updateFolder: (id: string, data: Partial<FlashcardFolder>) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (id: string, parentId: string | undefined) => void;
  
  // Organization
  moveDeckToFolder: (deckId: string, folderId: string | undefined) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  // Flashcards
  flashcards: [],
  newCardsPerDay: 20,
  
  addFlashcard: (front, back, deck = 'Default', tags = []) => {
    const id = uuidv4();
    
    const now = new Date();
    
    const newFlashcard: Flashcard = {
      id,
      front,
      back,
      deck,
      deckId: '',  // This would be set properly in a real implementation
      createdAt: now,
      updatedAt: now,
      lastReviewed: null,
      nextReview: now, // Due immediately
      interval: 0,
      easeFactor: 2.5,
      reviewCount: 0,
      consecutiveCorrect: 0,
      status: 'new',
      tags,
      easinessFactor: 2.5,
      repetitions: 0
    };
    
    set(state => ({
      flashcards: [...state.flashcards, newFlashcard]
    }));
    
    return id;
  },
  
  updateFlashcard: (id, data) => {
    set(state => ({
      flashcards: state.flashcards.map(card => 
        card.id === id ? { ...card, ...data, updatedAt: new Date() } : card
      )
    }));
  },
  
  deleteFlashcard: (id) => {
    set(state => ({
      flashcards: state.flashcards.filter(card => card.id !== id)
    }));
  },
  
  // Review functions
  reviewFlashcard: (id, quality) => {
    const { flashcards } = get();
    const cardIndex = flashcards.findIndex(card => card.id === id);
    
    if (cardIndex === -1) return;
    
    const card = flashcards[cardIndex];
    
    // Simple spaced repetition algorithm
    let newInterval: number;
    let newEaseFactor = card.easeFactor;
    let consecutiveCorrect = card.consecutiveCorrect;
    let status = card.status;
    
    if (quality <= 2) { // Hard rating
      newInterval = 1;
      newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
      consecutiveCorrect = 0;
      status = 'learning';
    } else if (quality === 3) { // Normal rating
      if (card.interval === 0) {
        newInterval = 1;
      } else if (card.interval === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.round(card.interval * card.easeFactor);
      }
      consecutiveCorrect += 1;
      status = card.interval >= 7 ? 'review' : 'learning';
    } else { // Easy rating (4-5)
      if (card.interval === 0) {
        newInterval = 3;
      } else {
        newInterval = Math.round(card.interval * card.easeFactor * 1.3);
      }
      newEaseFactor = Math.min(3.0, card.easeFactor + 0.15);
      consecutiveCorrect += 1;
      status = 'review';
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
      reviewCount: card.reviewCount + 1,
      consecutiveCorrect,
      lastReviewed: new Date(),
      nextReview: nextReviewDate,
      status
    };
    
    set({ flashcards: updatedFlashcards });
  },
  
  getDueFlashcards: (deck = 'all') => {
    const now = new Date();
    const { flashcards } = get();
    
    // Get all due cards (next review date is now or in the past)
    return flashcards.filter(card => 
      (deck === 'all' || card.deck === deck) && 
      card.status !== 'new' &&
      now >= new Date(card.nextReview)
    );
  },
  
  getNewFlashcards: (deck = 'all') => {
    const { flashcards } = get();
    
    // Get all new cards (never reviewed)
    return flashcards.filter(card => 
      (deck === 'all' || card.deck === deck) && 
      card.status === 'new'
    );
  },
  
  getRelatedFlashcards: (id, limit = 3) => {
    const { flashcards } = get();
    const card = flashcards.find(c => c.id === id);
    
    if (!card) return [];
    
    // Simplified implementation: just find cards from the same deck
    const relatedCards = flashcards
      .filter(c => c.id !== id && c.deck === card.deck)
      .slice(0, limit);
      
    return relatedCards;
  },
  
  setNewCardsPerDay: (count) => {
    set({ newCardsPerDay: count });
  },
  
  // Decks
  decks: [],
  addDeck: (name, description, folderId) => {
    const newDeck: FlashcardDeck = {
      id: uuidv4(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      cardCount: 0,
      folderId,
      color: '#e9e9e9',
      tags: []
    };
    
    set(state => ({
      decks: [...state.decks, newDeck]
    }));
    
    return newDeck;
  },
  
  updateDeck: (id, data) => {
    set(state => ({
      decks: state.decks.map(deck => 
        deck.id === id ? { ...deck, ...data, updatedAt: new Date() } : deck
      )
    }));
  },
  
  deleteDeck: (id) => {
    // Delete all flashcards in the deck
    const { flashcards } = get();
    const cardsToDelete = flashcards.filter(card => card.deckId === id);
    cardsToDelete.forEach(card => get().deleteFlashcard(card.id));
    
    // Delete the deck
    set(state => ({
      decks: state.decks.filter(deck => deck.id !== id)
    }));
  },
  
  duplicateDeck: (id) => {
    const { decks, flashcards } = get();
    const originalDeck = decks.find(d => d.id === id);
    
    if (!originalDeck) {
      throw new Error("Deck not found");
    }
    
    // Create new deck
    const newDeck = get().addDeck(
      `${originalDeck.name} (Copy)`, 
      originalDeck.description,
      originalDeck.folderId
    );
    
    // Duplicate all flashcards
    const deckFlashcards = flashcards.filter(card => card.deckId === id);
    deckFlashcards.forEach(card => {
      get().addFlashcard(card.front, card.back, newDeck.name, card.tags);
    });
    
    return newDeck;
  },
  
  // Folders
  folders: [],
  addFolder: (name, parentId) => {
    const newFolder: FlashcardFolder = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId,
      color: '#e9e9e9'
    };
    
    set(state => ({
      folders: [...state.folders, newFolder]
    }));
    
    return newFolder;
  },
  
  updateFolder: (id, data) => {
    set(state => ({
      folders: state.folders.map(folder => 
        folder.id === id ? { ...folder, ...data, updatedAt: new Date() } : folder
      )
    }));
  },
  
  deleteFolder: (id) => {
    const { folders, decks } = get();
    
    // Move all decks in this folder to no folder
    decks
      .filter(deck => deck.folderId === id)
      .forEach(deck => get().moveDeckToFolder(deck.id, undefined));
    
    // Move all subfolders to parent folder
    const folderToDelete = folders.find(f => f.id === id);
    if (folderToDelete) {
      folders
        .filter(folder => folder.parentId === id)
        .forEach(folder => get().moveFolder(folder.id, folderToDelete.parentId));
    }
    
    // Delete the folder
    set(state => ({
      folders: state.folders.filter(folder => folder.id !== id)
    }));
  },
  
  moveFolder: (id, parentId) => {
    // Prevent circular references
    if (id === parentId) {
      return;
    }
    
    const { folders } = get();
    const folder = folders.find(f => f.id === id);
    
    if (folder) {
      // Check if new parent is a descendant of the folder
      let current = parentId;
      while (current) {
        const parent = folders.find(f => f.id === current);
        if (parent?.id === id) {
          // Circular reference detected
          return;
        }
        current = parent?.parentId;
      }
      
      get().updateFolder(id, { parentId });
    }
  },
  
  // Organization
  moveDeckToFolder: (deckId, folderId) => {
    get().updateDeck(deckId, { folderId });
  }
}));