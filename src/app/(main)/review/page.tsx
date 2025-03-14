// src/app/(main)/review/page.tsx
import { ReviewDashboard } from '@/components/flashcards/review-dashboard';
import React from 'react';

export default function ReviewPage() {
  return (
    <div className="container mx-auto max-w-6xl py-4">
      <h1 className="text-2xl font-bold mb-6">Review Flashcards</h1>
      <ReviewDashboard />
    </div>
  );
}