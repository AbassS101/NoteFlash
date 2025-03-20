// src/store/note-store-hook.ts
"use client";

import { useContext } from 'react';
import { NoteStoreContextType } from '@/types/store-types';
import NoteStoreContext from './note-store-context';

// Custom hook to use the note store
export function useNoteStore(): NoteStoreContextType {
  const context = useContext(NoteStoreContext);
  
  if (context === undefined) {
    throw new Error('useNoteStore must be used within a NoteProvider');
  }
  
  return context;
}