// src/types/flashcard-types.ts
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    deck: string;
    deckId: string;
    createdAt: Date;
    updatedAt?: Date;
    lastReviewed: Date | null;
    nextReview: Date;
    interval: number;
    easeFactor: number;
    reviewCount: number;
    consecutiveCorrect: number;
    status: 'new' | 'learning' | 'review';
    tags: string[];
    
    // Backward compatibility fields
    easinessFactor: number;
    repetitions: number;
    nextReviewDate?: Date;
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
    content: any; // Can accept TipTap JSONContent
    createdAt: Date;
    updatedAt: Date;
    folderId?: string;
    tags?: string[];
  }