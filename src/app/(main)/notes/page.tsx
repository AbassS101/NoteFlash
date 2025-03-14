// src/app/(main)/notes/page.tsx
"use client";

import React from 'react';
import NoteList from '@/components/notes/note-list';
import NoteEditor from '@/components/notes/note-editor';
import { NoteProvider } from '@/store/note-store';

export default function NotesPage() {
  return (
    <NoteProvider>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="w-64">
          <NoteList />
        </div>
        <div className="flex-1 overflow-auto">
          <NoteEditor noteId={null} />
        </div>
      </div>
    </NoteProvider>
  );
}