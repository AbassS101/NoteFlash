// src/app/(main)/quizzes/results/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuizResults } from '@/components/quizzes/quiz-results';
import { useQuizStore } from '@/store/quiz-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

export default function QuizResultsPage() {
  const router = useRouter();
  const { currentQuiz, currentAttempt } = useQuizStore();
  
  // If no active quiz or attempt, redirect to quizzes page
  useEffect(() => {
    if (!currentQuiz || !currentAttempt) {
      router.push('/quizzes');
    }
  }, [currentQuiz, currentAttempt, router]);
  
  if (!currentQuiz || !currentAttempt) {
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No active quiz</h1>
        <p className="mb-6 text-muted-foreground">
          There is no active quiz attempt to show results for.
        </p>
        <Button onClick={() => router.push('/quizzes')} className={undefined} variant={undefined} size={undefined}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-4">
      <QuizResults />
    </div>
  );
}
