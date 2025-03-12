// src/components/flashcards/review-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/setting-store';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Layers, Timer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export function ReviewCard() {
  const { getNextReviewCard, reviewFlashcard, getReviewStats } = useFlashcardStore();
  const { reviewLimit } = useSettingsStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState<ReturnType<typeof getNextReviewCard>>(null);
  const [stats, setStats] = useState(getReviewStats());
  const [reviewStartTime, setReviewStartTime] = useState<Date | null>(null);
  const [averageTime, setAverageTime] = useState(0);
  const [reviewTimes, setReviewTimes] = useState<number[]>([]);
  const { toast } = useToast();

  // Load first card on component mount
  useEffect(() => {
    loadNextCard();
  }, []);

  const loadNextCard = () => {
    // Get next card based on review limit
    const dueCards = getNextReviewCard();
    setCurrentCard(dueCards);
    setIsFlipped(false);
    setReviewStartTime(new Date());
    setStats(getReviewStats());
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (quality: number) => {
    if (!currentCard) return;

    // Calculate review time
    if (reviewStartTime) {
      const now = new Date();
      const timeSpent = (now.getTime() - reviewStartTime.getTime()) / 1000; // in seconds
      
      // Only count if under 60 seconds (to filter out distractions)
      if (timeSpent < 60) {
        const newTimes = [...reviewTimes, timeSpent];
        setReviewTimes(newTimes);
        setAverageTime(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
      }
    }

    // Process review with SM-2 algorithm
    reviewFlashcard(currentCard.id, quality);
    
    // Show feedback
    const qualityText = quality <= 1 ? 'again soon' : 
                       quality === 3 ? 'in a few days' : 'in a longer interval';
    
    toast({
      title: "Card reviewed",
      description: `This card will be shown to you ${qualityText}.`,
    });
    
    // Load next card
    loadNextCard();
  };

  // Format average time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0s';
    return seconds < 60 ? `${Math.round(seconds)}s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
      <div className="w-full aspect-[16/9] mb-6 perspective-1000">
        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key={currentCard.id + (isFlipped ? 'back' : 'front')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Card 
                className={`w-full h-full flex items-center justify-center p-8 border-2 ${
                  isFlipped ? 'border-blue-500' : 'border-gray-200'
                } rounded-xl cursor-pointer shadow-lg`}
                onClick={handleFlip}
              >
                <div className="text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {isFlipped ? 'Answer' : 'Question'}
                  </h3>
                  <p className="text-2xl font-semibold">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="no-cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Card className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl shadow-lg">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">No more cards to review!</h3>
                  <p className="text-muted-foreground mb-6">
                    You've completed all your due reviews for today. Great job!
                  </p>
                  <Button onClick={() => loadNextCard()} className={undefined} variant={undefined} size={undefined}>
                    Check Again
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentCard && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-6"
            onClick={handleFlip}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Flip Card
          </Button>

          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-4 gap-2 w-full mb-6"
              >
                <Button onClick={() => handleReview(0)} className="bg-red-500 hover:bg-red-600" variant={undefined} size={undefined}>Again</Button>
                <Button onClick={() => handleReview(1)} className="bg-orange-500 hover:bg-orange-600" variant={undefined} size={undefined}>Hard</Button>
                <Button onClick={() => handleReview(3)} className="bg-green-500 hover:bg-green-600" variant={undefined} size={undefined}>Good</Button>
                <Button onClick={() => handleReview(5)} className="bg-blue-500 hover:bg-blue-600" variant={undefined} size={undefined}>Easy</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>Reviewed: {stats.reviewedToday}/{stats.dueToday}</span>
        </div>
        <div className="flex items-center">
          <Layers className="h-4 w-4 mr-1" />
          <span>Remaining: {stats.remaining}</span>
        </div>
        <div className="flex items-center">
          <Timer className="h-4 w-4 mr-1" />
          <span>Avg. Time: {formatTime(averageTime)}</span>
        </div>
      </div>
    </div>
  );
}