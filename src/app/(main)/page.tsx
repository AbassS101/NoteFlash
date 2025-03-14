"use client";

import { NoteList } from '@/components/notes/note-list';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import React from 'react';

// Import the Editor component using dynamic import to prevent client-side issues
const Editor = dynamic(() => import('@/components/editor/editor'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
});

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on the client side
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setIsLoading(false);
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (isLoading || status === 'loading') {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
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