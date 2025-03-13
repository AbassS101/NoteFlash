// src/app/(main)/review/session/page.tsx
'use client';

import { ReviewSession } from '@/components/flashcards/review-session';
import React from 'react';

export default function ReviewSessionPage() {
  return (
    <div className="container mx-auto max-w-6xl py-4">
      <ReviewSession />
    </div>
  );
}