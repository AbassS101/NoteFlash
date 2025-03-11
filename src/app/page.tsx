// src/app/(main)/page.tsx
import { NoteList } from '@/components/notes/note-list';
import Editor from '@/components/editor/editor';
import React from 'react';

export default function NotesPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <NoteList />
      <div className="flex-1 overflow-auto p-4">
        <Editor />
      </div>
    </div>
  );
}