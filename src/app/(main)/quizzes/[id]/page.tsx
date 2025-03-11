//src/app/(main)/quizzes/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QuizTaking } from '@/components/quizzes/quiz-taking';
import { useQuizStore } from '@/store/quiz-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import page from '../page';

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { quizzes, currentQuiz, startQuiz, fetchQuizzes } = useQuizStore();
  
  useEffect(() => {
    fetchQuizzes();
    
    // Start the quiz with the given ID
    if (id && typeof id === 'string') {
      startQuiz(id);
    }
  }, [id, startQuiz, fetchQuizzes]);
  
  // If quiz doesn't exist, show error and back button
  if (!currentQuiz || !quizzes.some(quiz => quiz.id === id)) {
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
        <p className="mb-6 text-muted-foreground">
          The quiz you're looking for doesn't exist or has been deleted.
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
      <QuizTaking />
    </div>
  );
}
