// src/store/note-store.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Note, NoteFolder } from '../types/flashcard-types';

interface NoteState {
  // Notes
  notes: Note[];
  addNote: (title: string, content: string, folderId?: string) => Note;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => Note;
  
  // Current Note Management
  currentNote: Note | null;
  setCurrentNote: (note: Note | null) => void;
  createNote: (folderId?: string) => Note;
  saveCurrentNote: () => void;
  
  // Folders
  folders: NoteFolder[];
  addFolder: (name: string, parentId?: string) => NoteFolder;
  updateFolder: (id: string, data: Partial<NoteFolder>) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (id: string, parentId: string | undefined) => void;
  
  // Organization
  moveNoteToFolder: (noteId: string, folderId: string | undefined) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  // Current Note Management
  currentNote: null,
  setCurrentNote: (note) => set({ currentNote: note }),
  createNote: (folderId) => {
    const newNote = get().addNote('Untitled Note', '', folderId);
    set({ currentNote: newNote });
    return newNote;
  },
  saveCurrentNote: () => {
    const { currentNote } = get();
    if (currentNote) {
      // We don't need to call updateNote here since currentNote is already part of the notes array
      // Just update the updatedAt timestamp
      set(state => ({
        notes: state.notes.map(note => 
          note.id === currentNote.id ? { ...currentNote, updatedAt: new Date() } : note
        )
      }));
    }
  },
  // Notes
  notes: [],
  addNote: (title, content, folderId) => {
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      folderId,
      tags: []
    };
    
    set(state => ({
      notes: [...state.notes, newNote]
    }));
    
    return newNote;
  },
  
  updateNote: (id, data) => {
    set(state => ({
      notes: state.notes.map(note => 
        note.id === id ? { ...note, ...data, updatedAt: new Date() } : note
      )
    }));
  },
  
  deleteNote: (id) => {
    set(state => ({
      notes: state.notes.filter(note => note.id !== id)
    }));
  },
  
  duplicateNote: (id) => {
    const { notes } = get();
    const originalNote = notes.find(n => n.id === id);
    
    if (!originalNote) {
      throw new Error("Note not found");
    }
    
    const newNote = get().addNote(
      `${originalNote.title} (Copy)`, 
      originalNote.content,
      originalNote.folderId
    );
    
    // Copy tags if they exist
    if (originalNote.tags && originalNote.tags.length > 0) {
      get().updateNote(newNote.id, { tags: [...originalNote.tags] });
    }
    
    return newNote;
  },
  
  // Folders
  folders: [],
  addFolder: (name, parentId) => {
    const newFolder: NoteFolder = {
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
    const { folders, notes } = get();
    
    // Move all notes in this folder to no folder
    notes
      .filter(note => note.folderId === id)
      .forEach(note => get().moveNoteToFolder(note.id, undefined));
    
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
  moveNoteToFolder: (noteId, folderId) => {
    get().updateNote(noteId, { folderId });
  },
  
  addTagToNote: (noteId, tag) => {
    const { notes } = get();
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
      const currentTags = note.tags || [];
      if (!currentTags.includes(tag)) {
        get().updateNote(noteId, { tags: [...currentTags, tag] });
      }
    }
  },
  
  removeTagFromNote: (noteId, tag) => {
    const { notes } = get();
    const note = notes.find(n => n.id === noteId);
    
    if (note && note.tags) {
      const updatedTags = note.tags.filter(t => t !== tag);
      get().updateNote(noteId, { tags: updatedTags });
    }
  }
}));