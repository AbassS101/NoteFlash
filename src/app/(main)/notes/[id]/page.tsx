"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNoteStore } from '@/store/note-store';
import dynamic from 'next/dynamic';
import React from 'react';

// Import the Editor component using dynamic import
const Editor = dynamic(() => import('@/components/editor/editor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
});

export default function NotePage() {
  const params = useParams();
  const { notes, setCurrentNote } = useNoteStore();
  
  // Get the note ID from the URL parameters
  const noteId = params?.id as string;
  
  // Set the current note when the component mounts
  useEffect(() => {
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setCurrentNote(note);
      }
    }
  }, [noteId, notes, setCurrentNote]);

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-auto">
      <Editor />
    </div>
  );
}