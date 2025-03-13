// src/app/(main)/page.tsx
import { NoteList } from '@/components/notes/note-list';
import dynamic from 'next/dynamic';
import { getCurrentUser } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';
import React from 'react';

// Import the Editor component using dynamic import to prevent SSR issues
// This ensures the component only loads on the client side
const Editor = dynamic(() => import('@/components/editor/editor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
});

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