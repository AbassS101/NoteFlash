// src/types/flashcard-types.ts

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    createdAt: Date;
    lastReviewed?: Date;
    nextReviewDate?: Date;
    easinessFactor: number;
    repetitions: number;
    interval: number;
    deckId: string;
  }
  
  export interface FlashcardDeck {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    cardCount: number;
    folderId?: string;
    color?: string;
    icon?: string;
    tags?: string[];
  }
  
  export interface FlashcardFolder {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    parentId?: string;
    color?: string;
    icon?: string;
  }
  
  export interface NoteFolder {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    parentId?: string;
    color?: string;
    icon?: string;
  }
  
  export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    folderId?: string;
    tags?: string[];
  }