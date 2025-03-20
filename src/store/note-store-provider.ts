// src/store/note-store-provider.tsx
"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NoteStoreContextType, NoteType, NoteFolderType, NoteTagType } from '@/types/store-types';
import NoteStoreContext from './note-store-context';

// Sample initial data
const initialNotes: NoteType[] = [
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
    created: new Date(),
    updated: new Date()
  }
];

const initialFolders: NoteFolderType[] = [
  { id: 'folder1', name: 'School', parentId: null },
  { id: 'folder2', name: 'Work', parentId: null },
  { id: 'folder3', name: 'Personal', parentId: null }
];

const initialTags: NoteTagType[] = [
  { id: 'tag1', name: 'Important', color: '#ef4444' },
  { id: 'tag2', name: 'To Review', color: '#3b82f6' },
  { id: 'tag3', name: 'Reference', color: '#10b981' }
];

// Provider component
export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<NoteType[]>(initialNotes);
  const [folders, setFolders] = useState<NoteFolderType[]>(initialFolders);
  const [tags, setTags] = useState<NoteTagType[]>(initialTags);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    initialNotes[0]?.id || null
  );
  const [currentNote, setCurrentNote] = useState<NoteType | null>(initialNotes[0] || null);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedNotes = localStorage.getItem('notes');
        const savedFolders = localStorage.getItem('folders');
        const savedTags = localStorage.getItem('tags');
        const savedActiveNoteId = localStorage.getItem('activeNoteId');

        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          setNotes(parsedNotes.map((note: NoteType) => ({
            ...note,
            created: new Date(note.created),
            updated: new Date(note.updated)
          })));

          // Set current note if active ID exists
          if (savedActiveNoteId) {
            const foundNote = parsedNotes.find((note: NoteType) => note.id === savedActiveNoteId);
            if (foundNote) {
              setCurrentNote({
                ...foundNote,
                created: new Date(foundNote.created),
                updated: new Date(foundNote.updated)
              });
            }
          }
        }
        
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
    const newNote: NoteType = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      },
      folderId: null,
      tags: [],
      created: new Date(),
      updated: new Date()
    };
    
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setCurrentNote(newNote);
  };

  // Update an existing note
  const updateNote = (updatedNote: NoteType) => {
    setNotes(notes.map(note => 
      note.id === updatedNote.id ? {
        ...updatedNote,
        updated: new Date()
      } : note
    ));
  };

  // Delete a note
  const deleteNote = (id: string) => {
    const filteredNotes = notes.filter(note => note.id !== id);
    setNotes(filteredNotes);
    
    if (activeNoteId === id) {
      setActiveNoteId(filteredNotes.length > 0 ? filteredNotes[0].id : null);
      setCurrentNote(filteredNotes.length > 0 ? filteredNotes[0] : null);
    }
  };

  // Create a new folder
  const createFolder = (name: string) => {
    const newFolder: NoteFolderType = {
      id: uuidv4(),
      name,
      parentId: null
    };
    
    setFolders([...folders, newFolder]);
  };

  // Update an existing folder
  const updateFolder = (updatedFolder: NoteFolderType) => {
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
  const createTag = (tag: NoteTagType) => {
    setTags([...tags, tag]);
  };

  // Update an existing tag
  const updateTag = (updatedTag: NoteTagType) => {
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
  const value: NoteStoreContextType = {
    notes,
    folders,
    tags,
    activeNoteId,
    currentNote,
    setActiveNoteId,
    setCurrentNote,
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