// src/components/flashcards/sm2-review-session.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, ArrowLeft, CheckCircle, Info, 
  ChevronLeft, ChevronRight, Brain,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import React from 'react';

// Enhanced Flashcard interface with SM-2 properties
interface SM2Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  created: Date;
  lastReviewed: Date | null;
  nextReview: Date;
  interval: number;      // days until next review
  easeFactor: number;    // starts at 2.5, minimum 1.3
  reviewCount: number;   // consecutive correct reviews
  status: 'new' | 'learning' | 'review';
  tags?: string[];
}

// Mapping of UI ratings to SM-2 quality values
const QUALITY_MAPPING = {
  'again': 1,    // Complete blackout, corresponds to "Again" in Anki
  'hard': 2,     // Incorrect response but upon seeing the answer it felt familiar
  'good': 3,     // Correct response, but required some effort to recall
  'easy': 4      // Perfect response with no hesitation
};

// SM-2 buttons styling
const RATING_STYLES = {
  'again': { 
    color: 'bg-red-500 hover:bg-red-600 text-white', 
    icon: ThumbsDown,
    label: 'Again',
    shortcut: '1',
    tooltip: 'Completely forgot (1)'
  },
  'hard': { 
    color: 'bg-orange-500 hover:bg-orange-600 text-white', 
    icon: ThumbsDown,
    label: 'Hard',
    shortcut: '2',
    tooltip: 'Recalled with difficulty (2)'
  },
  'good': { 
    color: 'bg-blue-500 hover:bg-blue-600 text-white', 
    icon: Brain,
    label: 'Good',
    shortcut: '3',
    tooltip: 'Recalled with some effort (3)'
  },
  'easy': { 
    color: 'bg-green-500 hover:bg-green-600 text-white', 
    icon: ThumbsUp,
    label: 'Easy',
    shortcut: '4',
    tooltip: 'Perfect recall (4)'
  }
};

// Component props
interface SM2ReviewSessionProps {
  flashcards: SM2Flashcard[];
  onReviewComplete: (reviewedCards: SM2Flashcard[]) => void;
  onCardReviewed: (flashcard: SM2Flashcard, quality: number) => void;
}

export function SM2ReviewSession({ 
  flashcards, 
  onReviewComplete, 
  onCardReviewed 
}: SM2ReviewSessionProps) {
  const [cards, setCards] = useState<SM2Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<SM2Flashcard[]>([]);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0
  });
  const [timeSpent, setTimeSpent] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Start timer for the session
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
      
      if (cards.length === 0) return;
      
      // Only handle rating shortcuts if card is flipped
      if (isFlipped) {
        switch (e.key) {
          case '1':
            handleRate('again');
            break;
          case '2':
            handleRate('hard');
            break;
          case '3':
            handleRate('good');
            break;
          case '4':
            handleRate('easy');
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
  }, [isFlipped, cards.length]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle rating with SM-2 algorithm
  const handleRate = (rating: keyof typeof QUALITY_MAPPING) => {
    if (cards.length === 0 || currentIndex >= cards.length) return;
    
    const currentCard = cards[currentIndex];
    const quality = QUALITY_MAPPING[rating];
    
    // Apply SM-2 algorithm
    const updatedCard = applySM2Algorithm(currentCard, quality);
    
    // Update statistics
    setSessionStats(prev => ({
      ...prev,
      [rating]: prev[rating] + 1,
      total: prev.total + 1
    }));
    
    // Add to reviewed cards
    setReviewedCards(prev => [...prev, updatedCard]);
    
    // Notify parent component
    onCardReviewed(updatedCard, quality);
    
    // Show feedback toast
    toast({
      title: `Rated as ${rating.charAt(0).toUpperCase() + rating.slice(1)}`,
      description: getReviewFeedback(rating, updatedCard.interval),
    });
    
    // Move to next card or finish
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Call the completion callback
      onReviewComplete(reviewedCards);
      
      toast({
        title: "Review session complete",
        description: `You've reviewed ${cards.length} cards!`,
      });
    }
  };

  // Implementation of the SM-2 algorithm
  const applySM2Algorithm = (card: SM2Flashcard, quality: number): SM2Flashcard => {
    let newInterval: number;
    let newReviewCount: number;
    let newEaseFactor: number = card.easeFactor;
    
    // Update ease factor according to SM-2 formula
    newEaseFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    // If quality < 3, reset repetitions (card was forgotten)
    if (quality < 3) {
      newReviewCount = 0;
      newInterval = 1; // Review tomorrow
    } else {
      // Increase repetition counter
      newReviewCount = card.reviewCount + 1;
      
      // Calculate new interval based on repetition count
      if (newReviewCount === 1) {
        newInterval = 1; // First successful review: 1 day
      } else if (newReviewCount === 2) {
        newInterval = 6; // Second successful review: 6 days
      } else {
        // For 3+ successful reviews: previous interval * ease factor
        newInterval = Math.round(card.interval * newEaseFactor);
      }
    }
    
    // Calculate the next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    return {
      ...card,
      interval: newInterval,
      easeFactor: newEaseFactor,
      reviewCount: newReviewCount,
      lastReviewed: new Date(),
      nextReview: nextReviewDate,
      status: newReviewCount > 2 ? 'review' : 'learning'
    };
  };

  // Get feedback message based on rating
  const getReviewFeedback = (rating: string, interval: number): string => {
    switch (rating) {
      case 'again':
        return 'You\'ll see this card again soon.';
      case 'hard':
        return 'You\'ll see this card again in a day or so.';
      case 'good':
        return `Next review in ${interval} day${interval !== 1 ? 's' : ''}.`;
      case 'easy':
        return `Great! Next review in ${interval} day${interval !== 1 ? 's' : ''}.`;
      default:
        return '';
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progress = cards.length > 0 
    ? Math.round(((currentIndex + (isFlipped ? 0.5 : 0)) / cards.length) * 100)
    : 0;

  // Get current card
  const currentCard = cards.length > 0 && currentIndex < cards.length 
    ? cards[currentIndex] 
    : null;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-muted-foreground mb-6">
            You have no cards to study right now.
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
      style={{ outline: 'none' }}
    >
      {/* Header with progress */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Studying with SM-2 Algorithm
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </p>
            {currentCard && (
              <Badge variant="outline" className="bg-opacity-50">
                {currentCard.status === 'new' ? 'New Card' : 
                 currentCard.reviewCount < 3 ? 'Learning' : 'Review Card'}
              </Badge>
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
              key={`${currentCard.id}-${isFlipped ? 'back' : 'front'}`}
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
                        {currentCard.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {currentCard.tags.length > 3 && <span className="text-xs">+{currentCard.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 text-sm text-muted-foreground flex items-center gap-2">
                    <span>
                      {currentCard.status === 'new' ? 'New' : 
                       currentCard.interval === 1 ? '1 day' :
                       `${currentCard.interval} days`}
                    </span>
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

      {/* SM-2 Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-4 gap-2 w-full"
          >
            {Object.entries(RATING_STYLES).map(([rating, style]) => {
              const RatingIcon = style.icon;
              return (
                <TooltipProvider key={rating}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                                  onClick={() => handleRate(rating as keyof typeof QUALITY_MAPPING)}
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

      {/* Navigation and info */}
      <div className="flex justify-between">
        <Button 
                  variant="outline"
                  onClick={() => {
                      if (currentIndex > 0) {
                          setCurrentIndex(prev => prev - 1);
                          setIsFlipped(false);
                      }
                  } }
                  disabled={currentIndex === 0} className={undefined} size={undefined}        >
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
              <p>SM-2 Spaced Repetition Algorithm</p>
              <p>1 (Again): Card forgotten, reset</p>
              <p>2 (Hard): Difficult recall, shorter interval</p>
              <p>3 (Good): Successful recall with effort</p>
              <p>4 (Easy): Perfect recall, longer interval</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
                  variant="outline"
                  onClick={() => {
                      if (!isFlipped) {
                          setIsFlipped(true);
                      } else if (currentIndex < cards.length - 1) {
                          setCurrentIndex(prev => prev + 1);
                          setIsFlipped(false);
                      }
                  } } className={undefined} size={undefined}        >
          {!isFlipped ? "Show Answer" : 
           currentIndex === cards.length - 1 ? "Finish Review" : "Next Card"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Session stats */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Session Stats</h3>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Cards</div>
              <div className="text-xl font-bold">{sessionStats.total}/{cards.length}</div>
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
              <div className="text-sm text-blue-500">Good</div>
              <div className="text-xl font-bold">{sessionStats.good}</div>
            </div>
            <div>
              <div className="text-sm text-green-500">Easy</div>
              <div className="text-xl font-bold">{sessionStats.easy}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts info */}
      <div className="flex justify-center text-sm text-muted-foreground space-x-6">
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">Space</span>
          <span>Flip card</span>
        </div>
        <div className="flex items-center">
          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">1-4</span>
          <span>Rate card</span>
        </div>
      </div>
    </div>
  );
}