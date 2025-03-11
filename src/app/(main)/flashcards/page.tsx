// src/app/(main)/flashcards/page.tsx
import { FlashcardGrid } from '@/components/flashcards/flashcard-grid';
import React from 'react';

export default function FlashcardsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-4">
      <FlashcardGrid />
    </div>
  );
}