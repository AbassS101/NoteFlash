// src/app/(main)/quizzes/page.tsx
import { QuizGrid } from '@/components/quizzes/quiz-grid';
import React from 'react';

export default function QuizzesPage() {
  return (
    <div className="container mx-auto max-w-6xl py-4">
      <QuizGrid />
    </div>
  );
}