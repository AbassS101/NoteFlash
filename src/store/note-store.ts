// src/store/note-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type JSONContent } from '@tiptap/react';

export interface Note {
  id: string;
  title: string;
  content: JSONContent;
  created: Date;
  updated: Date;
}

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;
  setCurrentNote: (noteId: string) => void;
  createNote: (title: string, content: JSONContent) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  fetchNotes: () => Promise<void>;
  saveNote: () => Promise<void>;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      currentNote: null,
      isLoading: false,
      error: null,
      
      setCurrentNote: (noteId) => {
        const note = get().notes.find(note => note.id === noteId);
        if (note) {
          set({ currentNote: note });
        }
      },
      
      createNote: (title, content) => {
        const newNote: Note = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title,
          content,
          created: new Date(),
          updated: new Date(),
        };
        
        set(state => ({ 
          notes: [...state.notes, newNote],
          currentNote: newNote
        }));
      },
      
      updateNote: (id, data) => {
        set(state => ({
          notes: state.notes.map(note => 
            note.id === id 
              ? { ...note, ...data, updated: new Date() } 
              : note
          ),
          currentNote: state.currentNote?.id === id 
            ? { ...state.currentNote, ...data, updated: new Date() } 
            : state.currentNote
        }));
      },
      
      deleteNote: (id) => {
        set(state => {
          const newNotes = state.notes.filter(note => note.id !== id);
          return { 
            notes: newNotes,
            currentNote: state.currentNote?.id === id 
              ? newNotes.length > 0 ? newNotes[0] : null 
              : state.currentNote
          };
        });
      },
      
      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // For now, we'll rely on the persisted state
          // const response = await fetch('/api/notes');
          // const notes = await response.json();
          // set({ notes, isLoading: false });
          
          set(state => ({
            isLoading: false,
            currentNote: state.notes.length > 0 && !state.currentNote 
              ? state.notes[0] 
              : state.currentNote
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch notes', 
            isLoading: false 
          });
        }
      },
      
      saveNote: async () => {
        const { currentNote } = get();
        if (!currentNote) return;
        
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // await fetch(`/api/notes/${currentNote.id}`, {
          //   method: 'PUT',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify(currentNote),
          // });
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save note', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'noteflash-notes',
      // Only persist the notes array, not loading states
      partialize: (state) => ({ notes: state.notes, currentNote: state.currentNote }),
    }
  )
);