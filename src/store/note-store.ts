// src/store/note-store.tsx
"use client";

import React, { 
  createContext, 
  useState, 
  useEffect, 
  useContext, 
  ReactNode 
} from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Note {
  id: string;
  title: string;
  content: {
    type: string;
    content: Array<{
      type: string;
      attrs?: { level?: number };
      content?: Array<{ type: string; text?: string }>;
    }>;
  };
  folderId: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface NoteTag {
  id: string;
  name: string;
  color: string;
}

// Sample initial data
const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Getting Started with NoteFlash',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to NoteFlash' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is your first note. You can edit it or create new notes.' }
          ]
        }
      ]
    },
    folderId: null,
    tags: ['tag1'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const initialFolders: NoteFolder[] = [
  { id: 'folder1', name: 'School', parentId: null },
  { id: 'folder2', name: 'Work', parentId: null },
  { id: 'folder3', name: 'Personal', parentId: null }
];

const initialTags: NoteTag[] = [
  { id: 'tag1', name: 'Important', color: '#ef4444' },
  { id: 'tag2', name: 'To Review', color: '#3b82f6' },
  { id: 'tag3', name: 'Reference', color: '#10b981' }
];

// Context type
export interface NoteStoreContextType {
  notes: Note[];
  folders: NoteFolder[];
  tags: NoteTag[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNote: () => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (folder: NoteFolder) => void;
  deleteFolder: (id: string) => void;
  createTag: (tag: NoteTag) => void;
  updateTag: (tag: NoteTag) => void;
  deleteTag: (id: string) => void;
  generateFlashcards: (noteId: string) => void;
  generateQuiz: (noteId: string) => void;
}

// Create a custom hook that handles context creation and usage
export function createNoteStore() {
  // Create the context with a type assertion
  const NoteStoreContext = createContext<NoteStoreContextType | undefined>(undefined);

  // Provider component
  function NoteProvider({ children }: { children: ReactNode }) {
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [folders, setFolders] = useState<NoteFolder[]>(initialFolders);
    const [tags, setTags] = useState<NoteTag[]>(initialTags);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(
      initialNotes[0]?.id || null
    );

    // Load data from localStorage on mount
    useEffect(() => {
      if (typeof window !== 'undefined') {
        try {
          const savedNotes = localStorage.getItem('notes');
          const savedFolders = localStorage.getItem('folders');
          const savedTags = localStorage.getItem('tags');
          const savedActiveNoteId = localStorage.getItem('activeNoteId');

          if (savedNotes) setNotes(JSON.parse(savedNotes).map((note: Note) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt)
          })));
          if (savedFolders) setFolders(JSON.parse(savedFolders));
          if (savedTags) setTags(JSON.parse(savedTags));
          if (savedActiveNoteId) setActiveNoteId(savedActiveNoteId);
        } catch (error) {
          console.error('Error loading data from localStorage:', error);
        }
      }
    }, []);

    // Save to localStorage when data changes
    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('folders', JSON.stringify(folders));
        localStorage.setItem('tags', JSON.stringify(tags));
        if (activeNoteId) localStorage.setItem('activeNoteId', activeNoteId);
      }
    }, [notes, folders, tags, activeNoteId]);

    // Create a new note
    const createNote = () => {
      const newNote: Note = {
        id: uuidv4(),
        title: 'Untitled Note',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph' }]
        },
        folderId: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setNotes([newNote, ...notes]);
      setActiveNoteId(newNote.id);
    };

    // Update an existing note
    const updateNote = (updatedNote: Note) => {
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? {
          ...updatedNote,
          updatedAt: new Date()
        } : note
      ));
    };

    // Delete a note
    const deleteNote = (id: string) => {
      const filteredNotes = notes.filter(note => note.id !== id);
      setNotes(filteredNotes);
      
      if (activeNoteId === id) {
        setActiveNoteId(filteredNotes.length > 0 ? filteredNotes[0].id : null);
      }
    };

    // Create a new folder
    const createFolder = (name: string) => {
      const newFolder: NoteFolder = {
        id: uuidv4(),
        name,
        parentId: null
      };
      
      setFolders([...folders, newFolder]);
    };

    // Update an existing folder
    const updateFolder = (updatedFolder: NoteFolder) => {
      setFolders(folders.map(folder => 
        folder.id === updatedFolder.id ? updatedFolder : folder
      ));
    };

    // Delete a folder
    const deleteFolder = (id: string) => {
      // Move notes from this folder to uncategorized
      setNotes(notes.map(note => 
        note.folderId === id ? { ...note, folderId: null } : note
      ));
      
      // Remove the folder
      setFolders(folders.filter(folder => folder.id !== id));
    };

    // Create a new tag
    const createTag = (tag: NoteTag) => {
      setTags([...tags, tag]);
    };

    // Update an existing tag
    const updateTag = (updatedTag: NoteTag) => {
      setTags(tags.map(tag => 
        tag.id === updatedTag.id ? updatedTag : tag
      ));
    };

    // Delete a tag
    const deleteTag = (id: string) => {
      // Remove this tag from all notes
      setNotes(notes.map(note => ({
        ...note,
        tags: note.tags.filter(tagId => tagId !== id)
      })));
      
      // Remove the tag
      setTags(tags.filter(tag => tag.id !== id));
    };

    // Generate flashcards from a note
    const generateFlashcards = (noteId: string) => {
      console.log(`Generating flashcards for note ${noteId}`);
      if (typeof window !== 'undefined') {
        window.location.href = `/flashcards?note=${noteId}`;
      }
    };

    // Generate a quiz from a note
    const generateQuiz = (noteId: string) => {
      console.log(`Generating quiz for note ${noteId}`);
      if (typeof window !== 'undefined') {
        window.location.href = `/quizzes?note=${noteId}`;
      }
    };

    // Value object that contains all the state and functions
    const value = {
      notes,
      folders,
      tags,
      activeNoteId,
      setActiveNoteId,
      createNote,
      updateNote,
      deleteNote,
      createFolder,
      updateFolder,
      deleteFolder,
      createTag,
      updateTag,
      deleteTag,
      generateFlashcards,
      generateQuiz
    };

    return (
      <NoteStoreContext.Provider value={value}>
        {children}
      </NoteStoreContext.Provider>
    );
  }

  // Custom hook to use the note store
  function useNoteStore() {
    const context = useContext(NoteStoreContext);
    
    if (context === undefined) {
      throw new Error('useNoteStore must be used within a NoteProvider');
    }
    
    return context;
  }

  return { NoteProvider, useNoteStore };
}

// Create and export the store
export const { NoteProvider, useNoteStore } = createNoteStore();