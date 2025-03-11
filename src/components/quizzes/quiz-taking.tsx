'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import React from 'react';

export function QuizTaking() {
  const router = useRouter();
  
  // Mock quiz data (replace with actual data source)
  const quiz = {
    id: "quiz1",
    title: "JavaScript Fundamentals",
    questions: [
      {
        id: "q1",
        text: "What is JavaScript?",
        options: ["A programming language", "A markup language", "A styling language", "A database"],
        correctAnswer: "A programming language"
      },
      {
        id: "q2",
        text: "Which of the following is a JavaScript data type?",
        options: ["String", "Division", "Table", "Paragraph"],
        correctAnswer: "String"
      },
      {
        id: "q3",
        text: "What does the '===' operator do in JavaScript?",
        options: [
          "Compares values and types for equality",
          "Assigns a value to a variable",
          "Compares only values for equality",
          "Creates a new variable"
        ],
        correctAnswer: "Compares values and types for equality"
      }
    ],
    timeLimit: 15
  };
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert minutes to seconds
  const [formattedTime, setFormattedTime] = useState('');
  
  // Update formatted time when timeLeft changes
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setFormattedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    
    // Set up countdown timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          handleFinishQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [timeLeft]);
  
  const currentQuestion = quiz.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / quiz.questions.length) * 100;
  
  const handleSelectOption = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = option;
    setAnswers(newAnswers);
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };
  
  const handleFinishQuiz = () => {
    // Check if all questions are answered
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to finish?`)) {
        return;
      }
    }
    
    // In a real app, you would save the answers and calculate the score
    // For now, we'll just redirect to the results page
    router.push('/quizzes/results');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
        </div>
        <div className="flex items-center text-muted-foreground space-x-2">
          <Clock className="h-4 w-4" />
          <span className={timeLeft < 60 ? 'text-destructive font-bold' : ''}>
            {formattedTime}
          </span>
        </div>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground mb-2">Question {currentQuestionIdx + 1}</div>
          <h2 className="text-xl font-medium mb-6">{currentQuestion.text}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                  answers[currentQuestionIdx] === option
                    ? 'border-primary bg-primary/10'
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleSelectOption(option)}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border text-sm mr-4 ${
                  answers[currentQuestionIdx] === option
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
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIdx === 0} className={undefined} size={undefined}        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentQuestionIdx < quiz.questions.length - 1 ? (
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
      
      {answers.includes(null) && (
        <div className="flex items-center justify-center text-sm text-amber-500 bg-amber-500/10 p-2 rounded-md mt-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>
            {answers.filter(a => a === null).length} question(s) unanswered
          </span>
        </div>
      )}
    </div>
  );
}