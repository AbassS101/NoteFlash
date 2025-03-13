// src/components/flashcards/review-session.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFlashcardStore, RatingLevel } from '@/store/flashcard-store';
import { MiniQuiz } from '../flashcards/mni-quiz';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, ArrowLeft, CheckCircle, Info, 
  ChevronLeft, ChevronRight, Brain,
  ThumbsUp, ThumbsDown, CornerDownRight, Sparkles
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
import { Badge } from '@/components/ui/badge';
import React from 'react';

// Style constants for the 3-level rating system
const RATING_STYLES = {
  hard: { 
    color: 'bg-red-500 hover:bg-red-600 text-white', 
    icon: ThumbsDown,
    label: 'Hard',
    shortcut: '1',
    tooltip: 'Difficult to recall (1-3 days)'
  },
  normal: { 
    color: 'bg-amber-500 hover:bg-amber-600 text-white', 
    icon: Brain,
    label: 'Normal',
    shortcut: '2',
    tooltip: 'Recalled with effort (3-7 days)'
  },
  easy: { 
    color: 'bg-green-500 hover:bg-green-600 text-white', 
    icon: ThumbsUp,
    label: 'Easy',
    shortcut: '3',
    tooltip: 'Easily recalled (7-14+ days)'
  }
};

// Quality values for each rating level
const RATING_QUALITY = {
  hard: 1,
  normal: 3,
  easy: 5
};

export function ReviewSession() {
  const { 
    flashcards, 
    getDueFlashcards, 
    getNewFlashcards,
    reviewFlashcard, 
    getRelatedFlashcards,
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
  const [relatedCards, setRelatedCards] = useState<any[]>([]);
  const [showRelatedCards, setShowRelatedCards] = useState(false);
  const [showMiniQuiz, setShowMiniQuiz] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState<Date | null>(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    newLearned: 0,
    hard: 0,
    normal: 0,
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
      hard: 0,
      normal: 0,
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
  
  // Find related cards when current card changes
  useEffect(() => {
    if (studyQueue.length > 0 && currentCardIndex < studyQueue.length) {
      const currentCard = studyQueue[currentCardIndex];
      if (currentCard) {
        const related = getRelatedFlashcards(currentCard.id, 3);
        setRelatedCards(related);
      }
    }
  }, [currentCardIndex, studyQueue, getRelatedFlashcards]);
  
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
            handleReview('hard');
            break;
          case '2':
            handleReview('normal');
            break;
          case '3':
            handleReview('easy');
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

    // Handle mini quiz completion
  const handleMiniQuizComplete = ({ success, rating }: { success: boolean; rating: number }) => {
    // Hide the mini quiz
    setShowMiniQuiz(false);
    
    // Submit the actual review using the result from the mini-quiz
    const qualityRating = success ? (rating === 5 ? 'easy' : 'normal') : 'hard';
    handleReview(qualityRating as RatingLevel);
    
    toast({
      title: success ? "Great job!" : "Keep practicing",
      description: success ? 
        "Successfully answered the active recall challenge!" : 
        "Don't worry, this helps strengthen your memory.",
    });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      // Load related cards when flipping to answer
      const currentCard = studyQueue[currentCardIndex];
      if (currentCard) {
        const related = getRelatedFlashcards(currentCard.id, 3);
        setRelatedCards(related);
        
        // Randomly determine whether to show mini-quiz (around 30% of the time)
        // More likely to show for difficult cards or new cards
        const isNewOrDifficult = currentCard.status === 'new' || 
                              currentCard.interval < 7 ||
                              (currentCard.lastRating && currentCard.lastRating === 'hard');
                              
        const quizProbability = isNewOrDifficult ? 0.4 : 0.2;
        setShowMiniQuiz(Math.random() < quizProbability);
      }
    }
  };

  const handleReview = (rating: RatingLevel) => {
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
      return {
        ...prev,
        reviewed: prev.reviewed + 1,
        newLearned: isNewCard && !prev.newLearned ? prev.newLearned + 1 : prev.newLearned,
        [rating]: prev[rating as keyof typeof prev] + 1,
        averageTime: (prev.averageTime * prev.reviewed + cardTime) / (prev.reviewed + 1),
      };
    });

    // Call the enhanced SM-2 algorithm
    reviewFlashcard(currentCard.id, RATING_QUALITY[rating]);
    
    // Show feedback based on rating
    const ratingInfo = RATING_STYLES[rating];
    toast({
      title: `Marked as ${ratingInfo.label}`,
      description: `You'll see this card again based on the SM-2 algorithm.`,
    });
    
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
      setShowRelatedCards(false);
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
    ? Math.round((uniqueCardsSeen.size / (studyQueue.length + uniqueCardsSeen.size)) * 100)
    : 100;

  const currentCard = studyQueue.length > 0 && currentCardIndex < studyQueue.length 
    ? studyQueue[currentCardIndex]
    : null;

  // Calculate interval streak display
  const getIntervalText = (card: any) => {
    if (!card) return '';
    
    if (card.status === 'new' || card.interval === 0) {
      return 'New';
    }
    
    if (card.interval === 1) {
      return '1 day';
    }
    
    if (card.interval < 30) {
      return `${card.interval} days`;
    }
    
    return `${Math.round(card.interval / 30)} months`;
  };
  
  // Get streak indicator for consecutive correct answers
  const getStreakIndicator = (count: number) => {
    if (count < 2) return null;
    
    const streakText = count >= 5 ? 'Excellent streak!' :
                      count >= 3 ? 'Good streak!' :
                      'Starting streak!';
                      
    return (
      <div className="flex items-center gap-1 text-amber-500">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-medium">{streakText} ({count})</span>
      </div>
    );
  };

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
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              {uniqueCardsSeen.size} of {totalCardCount} cards studied
              {learningQueue.length > 0 && ` • ${learningQueue.length} in learning`}
            </p>
            {currentCard && (
              <Badge variant="outline" className="bg-opacity-50">
                {currentCard.cardType === 'new' || currentCard.status === 'new' ? 
                  'New Card' : 
                  'Review Card'}
              </Badge>
            )}
            {currentCard && currentCard.consecutiveCorrect > 1 && (
              getStreakIndicator(currentCard.consecutiveCorrect)
            )}
          </div>
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
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge>{currentCard.deck}</Badge>
                    {currentCard.tags && currentCard.tags.length > 0 && (
                      <div className="flex gap-1">
                        {currentCard.tags.slice(0, 3).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {currentCard.tags.length > 3 && <span className="text-xs">+{currentCard.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 text-sm text-muted-foreground">
                    {getIntervalText(currentCard)}
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

      {/* Mini Quiz Section */}
      {isFlipped && showMiniQuiz && currentCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="my-4"
        >
          <MiniQuiz 
            cardId={currentCard.id} 
            onComplete={handleMiniQuizComplete}
            onSkip={() => setShowMiniQuiz(false)}
          />
        </motion.div>
      )}
      
      {/* Related Cards Section */}
      {isFlipped && !showMiniQuiz && relatedCards.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CornerDownRight className="h-4 w-4" />
              Related Flashcards
            </h3>
            <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRelatedCards(!showRelatedCards)} className={undefined}            >
              {showRelatedCards ? 'Hide' : 'Show'} ({relatedCards.length})
            </Button>
          </div>
          
          {showRelatedCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {relatedCards.map(card => (
                <Card key={card.id} className="p-3 text-sm">
                  <div className="font-medium mb-1">{card.front}</div>
                  <div className="text-muted-foreground text-xs">{card.back.substring(0, 80)}...</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts */}
      <div className="flex justify-center text-sm text-muted-foreground space-x-6">
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">Space</span>
          <span>Flip card</span>
        </div>
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">1-3</span>
          <span>Rate card</span>
        </div>
      </div>

      {/* Rating buttons - New 3-Level System */}
      <AnimatePresence>
        {isFlipped && !showMiniQuiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-3 gap-2 w-full"
          >
            {Object.entries(RATING_STYLES).map(([rating, style]) => {
              const RatingIcon = style.icon;
              return (
                <TooltipProvider key={rating}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                                  onClick={() => handleReview(rating as RatingLevel)}
                                  className={`${style.color} flex-col py-6`} variant={undefined} size={undefined}                      >
                        <RatingIcon className="h-6 w-6 mb-1" />
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs opacity-80 mt-1">{style.shortcut}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{style.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
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
              setShowRelatedCards(false);
            }
          }}
          disabled={currentCardIndex === 0}
          className={undefined} 
          size={undefined}
        >
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
              <p>Enhanced SM-2 Algorithm</p>
              <p>Hard: Repeat soon with shorter interval</p>
              <p>Normal: Standard interval progression</p>
              <p>Easy: Increase intervals faster</p>
              <p>Related cards are prioritized when you find a card difficult</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline"
          onClick={() => {
            if (currentCardIndex < studyQueue.length - 1) {
              setCurrentCardIndex(prev => prev + 1);
              setIsFlipped(false);
              setShowRelatedCards(false);
            }
          }}
          disabled={currentCardIndex === studyQueue.length - 1}
          className={undefined}
          size={undefined}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Session stats */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Session Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Reviewed</div>
              <div className="text-xl font-bold">{sessionStats.reviewed}</div>
            </div>
            <div>
              <div className="text-sm text-blue-500">New Learned</div>
              <div className="text-xl font-bold">{sessionStats.newLearned}</div>
            </div>
            <div>
              <div className="text-sm text-red-500">Hard</div>
              <div className="text-xl font-bold">{sessionStats.hard}</div>
            </div>
            <div>
              <div className="text-sm text-amber-500">Normal</div>
              <div className="text-xl font-bold">{sessionStats.normal}</div>
            </div>
            <div>
              <div className="text-sm text-green-500">Easy</div>
              <div className="text-xl font-bold">{sessionStats.easy}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}