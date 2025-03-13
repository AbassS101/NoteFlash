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
    deck: any; // Added to fix type issue
    tags?: string[];
    reviewCount?: number;
    easeFactor?: number;
    nextReview?: Date;
    status?: 'new' | 'learning' | 'review';
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
    content: any; // Changed from string to any to accept TipTap JSONContent
    createdAt: Date;
    updatedAt: Date;
    folderId?: string;
    tags?: string[];
  }