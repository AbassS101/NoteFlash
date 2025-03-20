// src/store/note-store-context.ts
"use client";

import { createContext } from 'react';
import { NoteStoreContextType } from '@/types/store-types';

// Create the context with default undefined value
const NoteStoreContext = createContext<NoteStoreContextType | undefined>(undefined);

export default NoteStoreContext;