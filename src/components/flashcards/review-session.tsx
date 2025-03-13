// src/components/flashcards/review-session.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, ArrowLeft, CheckCircle, Info, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from 'react';

// Learning step intervals in minutes - Anki-like
const LEARNING_STEPS = [1, 10, 60]; // 1 minute, 10 minutes, 60 minutes

const QUALITY_LABELS = {
  0: { label: 'Again', color: 'bg-red-500 hover:bg-red-600', shortcut: '1', interval: '<1 min' },
  1: { label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', shortcut: '2', interval: '1 min' },
  3: { label: 'Good', color: 'bg-green-500 hover:bg-green-600', shortcut: '3', interval: '10 min' },
  5: { label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600', shortcut: '4', interval: '1 day' }
};

export function ReviewSession() {
  const { 
    flashcards, 
    getDueFlashcards, 
    getNewFlashcards,
    reviewFlashcard, 
    getReviewStats,
    newCardsPerDay
  } = useFlashcardStore();
  
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedNewCardCount, setSelectedNewCardCount] = useState<number>(newCardsPerDay);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [newCards, setNewCards] = useState<any[]>([]);
  const [studyQueue, setStudyQueue] = useState<any[]>([]);
  const [learningQueue, setLearningQueue] = useState<any[]>([]);
  const [totalCardCount, setTotalCardCount] = useState(0);
  const [uniqueCardsSeen, setUniqueCardsSeen] = useState<Set<string>>(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<Date | null>(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    newLearned: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    averageTime: 0,
  });
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Load cards based on selected deck
  useEffect(() => {
    // Check if there's a deck and settings in session storage
    const storedDeck = sessionStorage.getItem('reviewDeck');
    const storedNewCardCount = sessionStorage.getItem('newCardCount');
    
    if (storedDeck) {
      setSelectedDeck(storedDeck);
      // Clear it after reading
      sessionStorage.removeItem('reviewDeck');
    }
    
    if (storedNewCardCount) {
      setSelectedNewCardCount(parseInt(storedNewCardCount));
      // Clear it after reading
      sessionStorage.removeItem('newCardCount');
    }
    
    // Get due review cards
    const reviewCards = getDueFlashcards(selectedDeck);
    setDueCards(reviewCards);
    
    // Get new cards (limited by the user's selection)
    const availableNewCards = getNewFlashcards(selectedDeck);
    const limitedNewCards = availableNewCards.slice(0, selectedNewCardCount);
    setNewCards(limitedNewCards);
    
    // Create the study queue by mixing new and due cards
    const queue = createInitialStudyQueue(reviewCards, limitedNewCards);
    setStudyQueue(queue);
    setLearningQueue([]); // Reset learning queue
    setTotalCardCount(reviewCards.length + limitedNewCards.length);
    setUniqueCardsSeen(new Set());
    
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setReviewStartTime(new Date());
    
    // Reset session stats
    setSessionStats({
      reviewed: 0,
      newLearned: 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      averageTime: 0,
    });
    
    // Start timer
    startTimer();
    
    return () => {
      // Clear timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedDeck, selectedNewCardCount, getDueFlashcards, getNewFlashcards]);
  
  // Create initial study queue
  const createInitialStudyQueue = (reviewCards: any[], newCards: any[]) => {
    const queue = [];
    
    // First add a few review cards if available (to warm up)
    const initialReviewCount = Math.min(reviewCards.length, 2);
    for (let i = 0; i < initialReviewCount; i++) {
      queue.push({ 
        ...reviewCards[i], 
        cardType: 'review' as const,
        learningStep: -1 // Not in learning steps
      });
    }
    
    // Then interleave new cards with review cards
    const remainingReviews = reviewCards.slice(initialReviewCount);
    
    let newIndex = 0;
    let reviewIndex = 0;
    
    // New cards first (up to 20% of queue)
    const initialNewCards = Math.min(newCards.length, Math.max(1, Math.ceil(newCards.length * 0.2)));
    for (let i = 0; i < initialNewCards && newIndex < newCards.length; i++, newIndex++) {
      queue.push({ 
        ...newCards[newIndex], 
        cardType: 'new' as const,
        learningStep: 0 // Start at first learning step
      });
    }
    
    // Then interleave in a 1:4 ratio (1 new card for every 4 reviews)
    while (
      newIndex < newCards.length || 
      reviewIndex < remainingReviews.length
    ) {
      // Add up to 4 review cards if available
      for (let i = 0; i < 4 && reviewIndex < remainingReviews.length; i++, reviewIndex++) {
        queue.push({ 
          ...remainingReviews[reviewIndex], 
          cardType: 'review' as const,
          learningStep: -1 // Not in learning steps
        });
      }
      
      // Add new card if available
      if (newIndex < newCards.length) {
        queue.push({ 
          ...newCards[newIndex], 
          cardType: 'new' as const,
          learningStep: 0 // Start at first learning step
        });
        newIndex++;
      }
    }
    
    return queue;
  };
  
  // Start a timer to track time spent
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeSpent(0);
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default space behavior (scrolling)
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        return;
      }
      
      if (studyQueue.length === 0) return;
      
      // Only handle rating shortcuts if card is flipped
      if (isFlipped) {
        switch (e.key) {
          case '1':
            handleReview(0);
            break;
          case '2':
            handleReview(1);
            break;
          case '3':
            handleReview(3);
            break;
          case '4':
            handleReview(5);
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowLeft':
            if (currentCardIndex > 0) {
              setCurrentCardIndex(prev => prev - 1);
              setIsFlipped(false);
            }
            break;
          case 'ArrowRight':
            if (currentCardIndex < studyQueue.length - 1) {
              setCurrentCardIndex(prev => prev + 1);
              setIsFlipped(false);
            }
            break;
        }
      }
    };
    
    // Focus container div to enable keyboard shortcuts
    if (containerRef.current) {
      containerRef.current.focus();
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, studyQueue, currentCardIndex]);
  
  // Function to add card back to queue for learning
  const requeueCard = (card: any, learningStep: number, delay: number) => {
    // Calculate the position to insert the card
    const currentTime = Date.now();
    const insertTime = currentTime + delay * 60 * 1000; // Convert minutes to milliseconds
    
    // Update the learning queue with the card and its scheduled time
    setLearningQueue(prev => [
      ...prev,
      {
        ...card,
        learningStep,
        scheduleTime: insertTime
      }
    ]);
  };
  
  // Check learning queue and insert cards when it's time
  useEffect(() => {
    if (learningQueue.length === 0) return;
    
    const checkInterval = setInterval(() => {
      const currentTime = Date.now();
      const readyCards = learningQueue.filter(card => card.scheduleTime <= currentTime);
      
      if (readyCards.length > 0) {
        // Insert cards that are ready to be studied
        setStudyQueue(prev => {
          // Insert the card after the current card
          const position = Math.min(currentCardIndex + 1, prev.length);
          return [
            ...prev.slice(0, position),
            ...readyCards,
            ...prev.slice(position)
          ];
        });
        
        // Remove the inserted cards from the learning queue
        setLearningQueue(prev => 
          prev.filter(card => card.scheduleTime > currentTime)
        );
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [learningQueue, currentCardIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (quality: number) => {
    if (studyQueue.length === 0) return;
    
    const currentCard = studyQueue[currentCardIndex];
    const isNewCard = currentCard.status === 'new' || currentCard.cardType === 'new';
    
    // Add card ID to set of unique cards seen
    setUniqueCardsSeen(prev => {
      const updated = new Set(prev);
      updated.add(currentCard.id);
      return updated;
    });

    // Calculate time spent on this card
    const cardTime = timeSpent;
    
    // Update session stats - only count each unique card once in totals
    setSessionStats(prev => {
      const qualityKey = quality === 0 ? 'again' : quality === 1 ? 'hard' : quality === 3 ? 'good' : 'easy';
      
      return {
        ...prev,
        reviewed: prev.reviewed + 1,
        newLearned: isNewCard && !prev.newLearned ? prev.newLearned + 1 : prev.newLearned,
        [qualityKey]: prev[qualityKey as keyof typeof prev] + 1,
        averageTime: (prev.averageTime * prev.reviewed + cardTime) / (prev.reviewed + 1),
      };
    });

    // Determine if card needs to be requeued based on learning steps
    if (currentCard.cardType === 'new' || currentCard.learningStep >= 0) {
      // This is a new card or a card in learning phase      
      if (quality === 0) { // Again
        // Reset to first step (1 minute)
        requeueCard(currentCard, 0, 1);
        
        toast({
          title: `Marked as Again`,
          description: `Card will repeat in <1 minute.`,
        });
      } else if (quality === 1) { // Hard
        // Keep at current step
        requeueCard(currentCard, currentCard.learningStep, LEARNING_STEPS[currentCard.learningStep]);
        
        toast({
          title: `Marked as Hard`,
          description: `Card will repeat in ${LEARNING_STEPS[currentCard.learningStep]} minute(s).`,
        });
      } else if (quality === 3) { // Good
        // Move to next step if available
        const nextStep = currentCard.learningStep + 1;
        if (nextStep < LEARNING_STEPS.length) {
          requeueCard(currentCard, nextStep, LEARNING_STEPS[nextStep]);
          
          toast({
            title: `Marked as Good`,
            description: `Card will repeat in ${LEARNING_STEPS[nextStep]} minute(s).`,
          });
        } else {
          // Graduate to review phase
          reviewFlashcard(currentCard.id, quality);
          
          toast({
            title: `Marked as Good`,
            description: `Card graduated to review phase. Next review tomorrow.`,
          });
        }
      } else { // Easy (5)
        // Graduate immediately
        reviewFlashcard(currentCard.id, quality);
        
        toast({
          title: `Marked as Easy`,
          description: `Card graduated to review phase. Next review in 4 days.`,
        });
      }
    } else {
      // This is a review card - use standard SM2 algorithm
      reviewFlashcard(currentCard.id, quality);
      
      // Show feedback
      const qualityInfo = QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS];
      toast({
        title: `Marked as ${qualityInfo.label}`,
        description: `This card will be shown to you again in ${qualityInfo.interval}.`,
      });
    }
    
    // Remove the current card from the queue
    const updatedQueue = [...studyQueue];
    updatedQueue.splice(currentCardIndex, 1);
    setStudyQueue(updatedQueue);
    
    // Update current card index
    if (updatedQueue.length === 0) {
      // No more cards left
      finishSession();
    } else {
      // Adjust index if needed (if we removed the last card)
      setCurrentCardIndex(prev => Math.min(prev, updatedQueue.length - 1));
      setIsFlipped(false);
      startTimer(); // Reset timer for next card
    }
  };
  
  const finishSession = () => {
    // Session complete
    toast({
      title: "Review session complete",
      description: `You've studied ${uniqueCardsSeen.size} cards (${sessionStats.newLearned} new).`,
    });
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress
  const progress = studyQueue.length > 0 
    ? Math.round((currentCardIndex / studyQueue.length) * 100)
    : 0;

  const currentCard = studyQueue.length > 0 && currentCardIndex < studyQueue.length 
    ? studyQueue[currentCardIndex]
    : null;

  if (studyQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-muted-foreground mb-6">
            You have no cards to study right now. Try adding some flashcards or checking back later!
          </p>
          <Button onClick={() => router.push('/flashcards')} className={undefined} variant={undefined} size={undefined}>
            Add More Flashcards
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="max-w-4xl mx-auto space-y-6"
      ref={containerRef}
      tabIndex={0} // Make div focusable for keyboard events
      style={{ outline: 'none' }} // Hide outline
    >
      {/* Header with progress and deck info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Studying {selectedDeck === 'all' ? 'All Decks' : selectedDeck}
          </h1>
          <p className="text-muted-foreground">
            {uniqueCardsSeen.size} of {totalCardCount} cards studied
            {learningQueue.length > 0 && ` • ${learningQueue.length} in learning`}
            {currentCard?.cardType === 'new' || currentCard?.status === 'new' ? 
              ' • New Card' : 
              ' • Review Card'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {formatTime(timeSpent)}
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/review')} className={undefined}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      {currentCard && (
        <div className="w-full aspect-video perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id + (isFlipped ? 'back' : 'front')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Card 
                className={`w-full h-full flex items-center justify-center p-8 
                  border-2 ${isFlipped ? 'border-blue-500' : 'border-gray-200'} 
                  rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                onClick={handleFlip}
              >
                <div className="text-center max-w-3xl">
                  <div className="absolute top-4 left-4 text-sm text-muted-foreground">
                    {currentCard.deck}
                    {currentCard.learningStep >= 0 ? 
                      ` • Step ${currentCard.learningStep + 1}/${LEARNING_STEPS.length}` : 
                      ''}
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {isFlipped ? 'Answer' : 'Question'}
                  </h3>
                  <div className="text-2xl font-semibold">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Keyboard shortcuts */}
      <div className="flex justify-center text-sm text-muted-foreground space-x-6">
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">Space</span>
          <span>Flip card</span>
        </div>
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">←</span>
          <span>Previous</span>
        </div>
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">→</span>
          <span>Next</span>
        </div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-4 gap-2 w-full"
          >
            {Object.entries(QUALITY_LABELS).map(([quality, info]) => (
              <TooltipProvider key={quality}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                                onClick={() => handleReview(parseInt(quality))}
                                className={info.color} variant={undefined} size={undefined}                    >
                      <span className="mr-2">{info.label}</span>
                      <span className="opacity-60">{info.shortcut}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Next review: {info.interval}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
                  variant="outline"
                  onClick={() => {
                      if (currentCardIndex > 0) {
                          setCurrentCardIndex(prev => prev - 1);
                          setIsFlipped(false);
                      }
                  } }
                  disabled={currentCardIndex === 0} className={undefined} size={undefined}        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={undefined}>
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>SM-2 Algorithm</p>
              <p>Again (1): Reset intervals</p>
              <p>Hard (2): Difficult card</p>
              <p>Good (3): Normal progression</p>
              <p>Easy (4): Increase intervals faster</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
                  variant="outline"
                  onClick={() => {
                      if (currentCardIndex < dueCards.length - 1) {
                          setCurrentCardIndex(prev => prev + 1);
                          setIsFlipped(false);
                      }
                  } }
                  disabled={currentCardIndex === dueCards.length - 1} className={undefined} size={undefined}        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Session stats */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Session Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Reviewed</div>
              <div className="text-xl font-bold">{sessionStats.reviewed}</div>
            </div>
            <div>
              <div className="text-sm text-indigo-500">New Learned</div>
              <div className="text-xl font-bold">{sessionStats.newLearned}</div>
            </div>
            <div>
              <div className="text-sm text-red-500">Again</div>
              <div className="text-xl font-bold">{sessionStats.again}</div>
            </div>
            <div>
              <div className="text-sm text-orange-500">Hard</div>
              <div className="text-xl font-bold">{sessionStats.hard}</div>
            </div>
            <div>
              <div className="text-sm text-green-500">Good</div>
              <div className="text-xl font-bold">{sessionStats.good}</div>
            </div>
            <div>
              <div className="text-sm text-blue-500">Easy</div>
              <div className="text-xl font-bold">{sessionStats.easy}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}