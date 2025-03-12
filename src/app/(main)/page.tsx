// src/app/(main)/page.tsx
import { NoteList } from '@/components/notes/note-list';
import Editor from '@/components/editor/editor';
import { getCurrentUser } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function NotesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <NoteList />
      <div className="flex-1 overflow-auto p-4">
        <Editor />
      </div>
    </div>
  );
}