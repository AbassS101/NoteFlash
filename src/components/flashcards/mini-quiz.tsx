// src/components/flashcards/mini-quiz.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Lightbulb, Send } from 'lucide-react';

// Define the props type
export interface MiniQuizProps {
  cardId: string;
  onComplete: ({ success, rating }: { success: boolean; rating: number }) => void;
  onSkip: () => void;
}

export const MiniQuiz: React.FC<MiniQuizProps> = ({ cardId, onComplete, onSkip }) => {
  const { flashcards } = useFlashcardStore();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'incorrect' | 'hint';
    message: string;
  } | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Find the current card
  const currentCard = flashcards.find(card => card.id === cardId);

  if (!currentCard) {
    return null;
  }

  const checkAnswer = () => {
    if (!currentCard) return;

    setAttempts(prev => prev + 1);

    // Normalize answers by trimming and converting to lowercase
    const normalizedCorrectAnswer = currentCard.back.trim().toLowerCase();
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();

    // Simple string similarity check
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer ||
      // Allow for minor typos or variations
      normalizedCorrectAnswer.includes(normalizedUserAnswer) ||
      normalizedUserAnswer.includes(normalizedCorrectAnswer);

    if (isCorrect) {
      setFeedback({
        type: 'correct',
        message: 'Correct! Great job recalling the answer.'
      });

      // Determine rating based on attempts
      const rating = attempts === 1 ? 5 : 3;
      
      // Slight delay to show feedback
      setTimeout(() => {
        onComplete({ success: true, rating });
      }, 500);
    } else {
      // Provide hints after multiple attempts
      if (attempts >= 2) {
        setFeedback({
          type: 'hint',
          message: `Hint: ${currentCard.back.substring(0, 20)}...`
        });
      } else {
        setFeedback({
          type: 'incorrect',
          message: 'Not quite right. Try again!'
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader className={undefined}>
          <CardTitle className="flex items-center justify-between">
            <span>Active Recall Challenge</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className={undefined}>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Try to recall the answer for this card without looking!
            </p>
            
            <div className="text-xl font-semibold mb-4">
              {currentCard.front}
            </div>
            
            <Input 
              placeholder="Type your answer here"
              value={userAnswer}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setUserAnswer(e.target.value)}
              onKeyDown={(e: { key: string; }) => {
                if (e.key === 'Enter') {
                  checkAnswer();
                }
              } }
              className="w-full" type={undefined}            />
            
            {feedback && (
              <div 
                className={`mt-2 p-2 rounded ${
                  feedback.type === 'correct' 
                    ? 'bg-green-100 text-green-800' 
                    : feedback.type === 'incorrect'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {feedback.type === 'hint' && <Lightbulb className="inline-block mr-2 h-4 w-4" />}
                {feedback.message}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={checkAnswer}
                disabled={!userAnswer}
                className="flex items-center" variant={undefined} size={undefined}              >
                <Send className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};