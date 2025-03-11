// src/components/quizzes/quiz-results.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quiz-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, BarChart, Clock, ArrowLeft, RotateCw, BookOpen } from 'lucide-react';
import React from 'react';

export function QuizResults() {
  const router = useRouter();
  const { currentQuiz, currentAttempt, startQuiz } = useQuizStore();
  
  if (!currentQuiz || !currentAttempt) {
    return null;
  }
  
  // Calculate results
  const results = currentQuiz.questions.map((question, idx) => {
    const userAnswer = currentAttempt.answers[idx];
    const isCorrect = userAnswer === question.correctAnswer;
    
    return {
      question,
      userAnswer,
      isCorrect,
    };
  });
  
  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectCount = results.filter(r => !r.isCorrect).length;
  const unansweredCount = results.filter(r => r.userAnswer === null).length;
  const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
  
  // Calculate time taken
  const startTime = new Date(currentAttempt.startTime);
  const endTime = currentAttempt.endTime ? new Date(currentAttempt.endTime) : new Date();
  const timeTakenSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
  const minutes = Math.floor(timeTakenSeconds / 60);
  const seconds = timeTakenSeconds % 60;
  const timeTaken = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Handle retake quiz
  const handleRetakeQuiz = () => {
    startQuiz(currentQuiz.id);
    router.push(`/quizzes/${currentQuiz.id}`);
  };
  
  // Get score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quiz Results: {currentQuiz.title}</h1>
        <Button variant="outline" onClick={() => router.push('/quizzes')} className={undefined} size={undefined}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
      
      <div className="flex items-center justify-center py-8">
        <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-8 border-muted">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          <div 
            className="absolute inset-0 rounded-full border-8 border-transparent"
            style={{
              borderTopColor: score >= 50 ? (score >= 70 ? (score >= 90 ? '#22c55e' : '#10b981') : '#f59e0b') : '#ef4444',
              transform: `rotate(${45 + (score * 3.6 / 2)}deg)`,
              clipPath: 'inset(0 0 50% 50%)',
            }}
          ></div>
          <div 
            className="absolute inset-0 rounded-full border-8 border-transparent"
            style={{
              borderTopColor: score >= 50 ? (score >= 70 ? (score >= 90 ? '#22c55e' : '#10b981') : '#f59e0b') : '#ef4444',
              transform: `rotate(${-135 + (score * 3.6 / 2)}deg)`,
              clipPath: 'inset(50% 50% 0 0)',
            }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={undefined}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Correct Answers
            </CardTitle>
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{correctCount} / {currentQuiz.questions.length}</div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              Incorrect Answers
            </CardTitle>
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{incorrectCount} / {currentQuiz.questions.length}</div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Time Taken
            </CardTitle>
          </CardHeader>
          <CardContent className={undefined}>
            <div className="text-2xl font-bold">{timeTaken}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center space-x-4 py-4">
        <Button variant="outline" onClick={handleRetakeQuiz} className={undefined} size={undefined}>
          <RotateCw className="h-4 w-4 mr-2" />
          Retake Quiz
        </Button>
        <Button className={undefined} variant={undefined} size={undefined}>
          <BookOpen className="h-4 w-4 mr-2" />
          Study Incorrect Questions
        </Button>
      </div>
      
      <h2 className="text-xl font-bold mt-8 mb-4">Question Review</h2>
      
      <div className="space-y-4">
        {results.map((result, idx) => (
          <Card key={idx} className={`border-l-4 ${
            result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
          }`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-[auto,1fr] gap-4">
                <div className={`p-2 rounded-full ${
                  result.isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {result.isCorrect ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Question {idx + 1}: {result.question.text}</h3>
                  <div className="space-y-1 text-sm">
                    {result.question.options.map((option, optIdx) => (
                      <div 
                        key={optIdx}
                        className={`p-2 rounded ${
                          option === result.question.correctAnswer
                            ? 'bg-green-500/10'
                            : option === result.userAnswer && !result.isCorrect
                              ? 'bg-red-500/10'
                              : ''
                        }`}
                      >
                        <span className="inline-block w-6">{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{option}</span>
                        {option === result.question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 inline-block ml-2 text-green-500" />
                        )}
                        {option === result.userAnswer && !result.isCorrect && (
                          <XCircle className="h-4 w-4 inline-block ml-2 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}