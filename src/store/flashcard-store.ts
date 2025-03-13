// src/store/flashcard-store.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Flashcard, FlashcardDeck, FlashcardFolder } from '../types/flashcard-types';

interface FlashcardState {
  // Flashcards
  flashcards: Flashcard[];
  addFlashcard: (deckId: string, front: string, back: string) => Flashcard;
  updateFlashcard: (id: string, data: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  
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
  addFlashcard: (deckId, front, back) => {
    const newFlashcard: Flashcard = {
      id: uuidv4(),
      front,
      back,
      createdAt: new Date(),
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
      deckId,
      deck: function (front: string, back: string, deck: any, arg3: any): unknown {
        throw new Error('Function not implemented.');
      },
      tags: [],
      reviewCount: 0,
      easeFactor: undefined,
      nextReview: undefined,
      status: undefined
    };
    
    set(state => ({
      flashcards: [...state.flashcards, newFlashcard]
    }));
    
    // Update card count for the deck
    const { decks } = get();
    const deckIndex = decks.findIndex(d => d.id === deckId);
    if (deckIndex >= 0) {
      get().updateDeck(deckId, { cardCount: decks[deckIndex].cardCount + 1 });
    }
    
    return newFlashcard;
  },
  
  updateFlashcard: (id, data) => {
    set(state => ({
      flashcards: state.flashcards.map(card => 
        card.id === id ? { ...card, ...data } : card
      )
    }));
  },
  
  deleteFlashcard: (id) => {
    const { flashcards } = get();
    const card = flashcards.find(c => c.id === id);
    
    set(state => ({
      flashcards: state.flashcards.filter(card => card.id !== id)
    }));
    
    if (card) {
      // Update card count for the deck
      const { decks } = get();
      const deckIndex = decks.findIndex(d => d.id === card.deckId);
      if (deckIndex >= 0) {
        get().updateDeck(card.deckId, { cardCount: decks[deckIndex].cardCount - 1 });
      }
    }
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
      get().addFlashcard(newDeck.id, card.front, card.back);
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