// src/types/store-types.ts
import { Flashcard, FlashcardDeck, FlashcardFolder } from './flashcard-types';

// Type for rating levels
export type RatingLevel = 'hard' | 'normal' | 'easy';

// SM-2 Quality enum
export enum SM2Quality {
  AGAIN = 0,  // Complete blackout, need to relearn
  HARD = 1,   // Incorrect response, but upon seeing answer, it felt familiar
  GOOD = 2,   // Correct response, but with difficulty
  FAIR = 3,   // Correct response after hesitation
  EASY = 4,   // Correct response with perfect recall
  PERFECT = 5 // Correct response that felt natural and effortless
}

export interface FlashcardStoreState {
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

export interface NoteFolderType {
  id: string;
  name: string;
  parentId: string | null;
}

export interface NoteTagType {
  id: string;
  name: string;
  color: string;
}

export interface NoteType {
  id: string;
  title: string;
  content: any;
  folderId: string | null;
  tags: string[];
  created: Date;
  updated: Date;
}

export interface NoteStoreContextType {
  notes: NoteType[];
  folders: NoteFolderType[];
  tags: NoteTagType[];
  activeNoteId: string | null;
  currentNote: NoteType | null;
  setActiveNoteId: (id: string | null) => void;
  setCurrentNote: (note: NoteType) => void;
  createNote: () => void;
  updateNote: (note: NoteType) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (folder: NoteFolderType) => void;
  deleteFolder: (id: string) => void;
  createTag: (tag: NoteTagType) => void;
  updateTag: (tag: NoteTagType) => void;
  deleteTag: (id: string) => void;
  generateFlashcards: (noteId: string) => void;
  generateQuiz: (noteId: string) => void;
}

export interface SM2FlashcardData {
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

export interface SM2FlashcardState {
  flashcards: SM2FlashcardData[];
  currentReviewDeck: string;
  newCardsPerDay: number;
  isLoading: boolean;
  error: string | null;
  
  // Core flashcard functions
  addFlashcard: (front: string, back: string, deck?: string, tags?: string[]) => string;
  updateFlashcard: (id: string, data: Partial<SM2FlashcardData>) => void;
  deleteFlashcard: (id: string) => void;
  reviewFlashcard: (id: string, quality: SM2Quality) => void;
  
  // Get flashcards for review
  getDueFlashcards: (deck?: string, limit?: number) => SM2FlashcardData[];
  getNewFlashcards: (deck?: string, limit?: number) => SM2FlashcardData[];
  
  // Configuration
  setNewCardsPerDay: (count: number) => void;
  setCurrentReviewDeck: (deck: string) => void;
  fetchFlashcards: () => Promise<void>;
}

export interface SettingsState {
  darkMode: boolean;
  autoSave: boolean;
  fontSize: 'small' | 'medium' | 'large';
  spacedRepetition: boolean;
  reviewLimit: number;
  autoGenerate: boolean;
  shuffleQuiz: boolean;
  showAnswers: boolean;
  updateSettings: (settings: Partial<SettingsState>) => void;
}