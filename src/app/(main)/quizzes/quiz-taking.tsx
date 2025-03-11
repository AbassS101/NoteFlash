// src/components/quizzes/quiz-taking.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quiz-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export function QuizTaking() {
  const router = useRouter();
  const { currentQuiz, currentAttempt, answerQuestion, finishQuiz } = useQuizStore();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    if (!currentQuiz || !currentAttempt) {
      router.push('/quizzes');
      return;
    }
    
    // Initialize timer
    const totalSeconds = currentQuiz.timeLimit * 60;
    setTimeLeft(totalSeconds);
    
    // Start countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentQuiz, currentAttempt, router]);
  
  // Format time as MM:SS
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setFormattedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }, [timeLeft]);
  
  if (!currentQuiz || !currentAttempt) {
    return null;
  }
  
  const currentQuestion = currentQuiz.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / currentQuiz.questions.length) * 100;
  
  const handleSelectOption = (option: string) => {
    answerQuestion(currentQuestionIdx, option);
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIdx < currentQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };
  
  const handleFinishQuiz = () => {
    // Check if all questions are answered
    const unanswered = currentAttempt.answers.filter(a => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to finish?`)) {
        return;
      }
    }
    
    finishQuiz();
    router.push('/quizzes/results');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentQuiz.title}</h1>
          <p className="text-muted-foreground">Question {currentQuestionIdx + 1} of {currentQuiz.questions.length}</p>
        </div>
        <div className="flex items-center text-muted-foreground space-x-2">
          <Clock className="h-4 w-4" />
          <span className={timeLeft < 60 ? 'text-destructive font-bold' : ''}>
            {formattedTime}
          </span>
        </div>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Question {currentQuestionIdx + 1}</div>
              <h2 className="text-xl font-medium mb-6">{currentQuestion.text}</h2>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                      currentAttempt.answers[currentQuestionIdx] === option
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectOption(option)}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border text-sm mr-4 ${
                      currentAttempt.answers[currentQuestionIdx] === option
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIdx === 0} className={undefined} size={undefined}        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentQuestionIdx < currentQuiz.questions.length - 1 ? (
          <Button onClick={handleNextQuestion} className={undefined} variant={undefined} size={undefined}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleFinishQuiz} className={undefined} variant={undefined} size={undefined}>
            Finish Quiz
          </Button>
        )}
      </div>
      
      {currentAttempt.answers.includes(null) && (
        <div className="flex items-center justify-center text-sm text-amber-500 bg-amber-500/10 p-2 rounded-md mt-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>
            {currentAttempt.answers.filter(a => a === null).length} question(s) unanswered
          </span>
        </div>
      )}
    </div>
  );
}