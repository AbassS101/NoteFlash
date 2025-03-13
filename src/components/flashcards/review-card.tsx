// src/components/flashcards/review-card.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFlashcardStore } from '@/store/flashcard-store';
import React from 'react';

export function ReviewCard() {
  const router = useRouter();
  
  useEffect(() => {
    // Automatically redirect to the new review dashboard
    router.push('/review');
  }, [router]);

  // This component is now just a redirect wrapper
  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to review dashboard...</p>
    </div>
  );
}