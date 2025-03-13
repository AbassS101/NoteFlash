// src/components/flashcards/review-session.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFlashcardStore, RatingLevel } from '@/store/flashcard-store';
import { MiniQuiz } from './mini-quiz';
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
    tooltip: 'Will repeat soon (1)'
  },
  normal: { 
    color: 'bg-amber-500 hover:bg-amber-600 text-white', 
    icon: Brain,
    label: 'Normal',
    shortcut: '2',
    tooltip: 'Will repeat later (2)'
  },
  easy: { 
    color: 'bg-green-500 hover:bg-green-600 text-white', 
    icon: ThumbsUp,
    label: 'Easy',
    shortcut: '3',
    tooltip: 'Remove from session (3)'
  }
};

// Quality values for each rating level
const RATING_QUALITY = {
  hard: 1,
  normal: 3,
  easy: 5
};

// Cards are objects with a reviews counter
interface SessionCard {
  card: any;        // The original flashcard
  repetitions: number; // How many times it's been shown in this session
  lastRating: RatingLevel | null; // Last rating given
}

export function ReviewSession() {
  const { 
    flashcards, 
    getDueFlashcards, 
    getNewFlashcards,
    reviewFlashcard, 
    getRelatedFlashcards,
    newCardsPerDay
  } = useFlashcardStore();
  
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedNewCardCount, setSelectedNewCardCount] = useState<number>(newCardsPerDay);
  
  // Session state
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [relatedCards, setRelatedCards] = useState<any[]>([]);
  const [showRelatedCards, setShowRelatedCards] = useState(false);
  const [showMiniQuiz, setShowMiniQuiz] = useState(false);
  
  // Stats
  const [uniqueCards, setUniqueCards] = useState<Set<string>>(new Set());
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalReviews: 0,
    uniqueCards: 0,
    hard: 0,
    normal: 0,
    easy: 0,
    completed: 0
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize session with cards
  useEffect(() => {
    // Check if there's a deck and settings in session storage
    const storedDeck = sessionStorage.getItem('reviewDeck');
    const storedNewCardCount = sessionStorage.getItem('newCardCount');
    
    if (storedDeck) {
      setSelectedDeck(storedDeck);
      sessionStorage.removeItem('reviewDeck');
    }
    
    if (storedNewCardCount) {
      setSelectedNewCardCount(parseInt(storedNewCardCount));
      sessionStorage.removeItem('newCardCount');
    }
    
    // Get due review cards
    const reviewCards = getDueFlashcards(selectedDeck);
    
    // Get new cards (limited by the user's selection)
    const availableNewCards = getNewFlashcards(selectedDeck);
    const limitedNewCards = availableNewCards.slice(0, selectedNewCardCount);
    
    // Prepare session cards
    const initialSessionCards: SessionCard[] = [];
    
    // Add review cards first (max 2 to start)
    const initialReviewCount = Math.min(reviewCards.length, 2);
    for (let i = 0; i < initialReviewCount; i++) {
      initialSessionCards.push({
        card: reviewCards[i],
        repetitions: 0,
        lastRating: null
      });
    }
    
    // Add a few new cards
    const initialNewCards = Math.min(limitedNewCards.length, 2);
    for (let i = 0; i < initialNewCards; i++) {
      initialSessionCards.push({
        card: limitedNewCards[i],
        repetitions: 0,
        lastRating: null
      });
    }
    
    // Interleave remaining cards (1 new : 4 review ratio)
    const remainingReviews = reviewCards.slice(initialReviewCount);
    const remainingNew = limitedNewCards.slice(initialNewCards);
    
    let reviewIdx = 0;
    let newIdx = 0;
    
    while (reviewIdx < remainingReviews.length || newIdx < remainingNew.length) {
      // Add up to 4 review cards
      for (let i = 0; i < 4 && reviewIdx < remainingReviews.length; i++, reviewIdx++) {
        initialSessionCards.push({
          card: remainingReviews[reviewIdx],
          repetitions: 0,
          lastRating: null
        });
      }
      
      // Add 1 new card if available
      if (newIdx < remainingNew.length) {
        initialSessionCards.push({
          card: remainingNew[newIdx],
          repetitions: 0,
          lastRating: null
        });
        newIdx++;
      }
    }
    
    setSessionCards(initialSessionCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUniqueCards(new Set());
    
    // Reset stats
    setSessionStats({
      totalReviews: 0,
      uniqueCards: 0,
      hard: 0,
      normal: 0,
      easy: 0,
      completed: 0
    });
    
    // Start timer
    startTimer();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedDeck, selectedNewCardCount, getDueFlashcards, getNewFlashcards]);
  
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
  
  // Find related cards when current card changes
  useEffect(() => {
    if (sessionCards.length > 0 && currentIndex < sessionCards.length) {
      const currentSessionCard = sessionCards[currentIndex];
      if (currentSessionCard) {
        const related = getRelatedFlashcards(currentSessionCard.card.id, 3);
        setRelatedCards(related);
      }
    }
  }, [currentIndex, sessionCards, getRelatedFlashcards]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default space behavior (scrolling)
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        return;
      }
      
      if (sessionCards.length === 0) return;
      
      // Only handle rating shortcuts if card is flipped
      if (isFlipped) {
        switch (e.key) {
          case '1':
            handleRate('hard');
            break;
          case '2':
            handleRate('normal');
            break;
          case '3':
            handleRate('easy');
            break;
        }
      } else {
        switch (e.key) {
          case 'ArrowLeft':
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
              setIsFlipped(false);
            }
            break;
          case 'ArrowRight':
            if (currentIndex < sessionCards.length - 1) {
              setCurrentIndex(prev => prev + 1);
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
  }, [isFlipped, sessionCards, currentIndex]);

  const handleMiniQuizComplete = ({ success, rating }: { success: boolean; rating: number }) => {
    // Hide the mini quiz
    setShowMiniQuiz(false);
    
    // Submit the actual review using the result from the mini-quiz
    const qualityRating = success ? (rating === 5 ? 'easy' : 'normal') : 'hard';
    handleRate(qualityRating as RatingLevel);
    
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
      const currentSessionCard = sessionCards[currentIndex];
      if (currentSessionCard) {
        const related = getRelatedFlashcards(currentSessionCard.card.id, 3);
        setRelatedCards(related);
        
        // Randomly determine whether to show mini-quiz (around 30% of the time)
        // More likely to show for difficult cards or new cards
        const isNewOrDifficult = 
          currentSessionCard.card.status === 'new' || 
          currentSessionCard.card.interval < 7 ||
          currentSessionCard.lastRating === 'hard';
                              
        const quizProbability = isNewOrDifficult ? 0.4 : 0.2;
        setShowMiniQuiz(Math.random() < quizProbability);
      }
    }
  };

  const handleRate = (rating: RatingLevel) => {
    if (sessionCards.length === 0) return;
    
    const currentSessionCard = sessionCards[currentIndex];
    const card = currentSessionCard.card;
    
    // Track unique cards
    const uniqueCardSet = new Set(uniqueCards);
    const isFirstReview = !uniqueCardSet.has(card.id);
    
    if (isFirstReview) {
      uniqueCardSet.add(card.id);
      setUniqueCards(uniqueCardSet);
    }
    
    // Update stats
    setSessionStats(prev => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
      uniqueCards: uniqueCardSet.size,
      [rating]: prev[rating] + 1,
      completed: rating === 'easy' ? prev.completed + 1 : prev.completed
    }));
    
    // Call the spaced repetition algorithm to update card metadata in the store
    reviewFlashcard(card.id, RATING_QUALITY[rating]);
    
    // Update the session card
    const updatedSessionCard = {
      ...currentSessionCard,
      repetitions: currentSessionCard.repetitions + 1,
      lastRating: rating
    };
    
    // Create a copy of the session cards array
    const updatedSessionCards = [...sessionCards];
    
    // Remove the current card first
    updatedSessionCards.splice(currentIndex, 1);
    
    // Handle card based on rating
    if (rating === 'hard') {
      // For 'hard', put the card 1-2 positions later (almost immediate review)
      const reinsertPosition = Math.min(currentIndex + 1, updatedSessionCards.length);
      updatedSessionCards.splice(reinsertPosition, 0, updatedSessionCard);
      
      toast({
        title: "Marked as Hard",
        description: "Card will repeat again very soon."
      });
    } else if (rating === 'normal') {
      // For 'normal', put the card a bit further (5-8 cards later)
      // The exact position depends on how many times we've seen this card
      const delay = Math.min(5 + updatedSessionCard.repetitions, 8);
      const reinsertPosition = Math.min(currentIndex + delay, updatedSessionCards.length);
      updatedSessionCards.splice(reinsertPosition, 0, updatedSessionCard);
      
      toast({
        title: "Marked as Normal",
        description: "Card will repeat again later in this session."
      });
    } else {
      // For 'easy', don't reinsert (card is done for this session)
      toast({
        title: "Marked as Easy",
        description: "Card will be scheduled for future review."
      });
    }
    
    // Update state
    setSessionCards(updatedSessionCards);
    
    // If there are no more cards, session is finished
    if (updatedSessionCards.length === 0) {
      finishSession();
      return;
    }
    
    // Adjust current index if needed
    if (currentIndex >= updatedSessionCards.length) {
      setCurrentIndex(updatedSessionCards.length - 1);
    }
    
    // Reset UI for next card
    setIsFlipped(false);
    setShowRelatedCards(false);
    setShowMiniQuiz(false);
    
    // Reset timer for next card
    setTimeSpent(0);
  };
  
  const finishSession = () => {
    toast({
      title: "Review session complete",
      description: `You've studied ${uniqueCards.size} unique cards with ${sessionStats.totalReviews} total reviews.`,
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
  
  // Calculate progress percentage
  const totalToReview = uniqueCards.size + sessionCards.length - 1;
  const progress = totalToReview > 0 
    ? Math.round((sessionStats.completed / totalToReview) * 100)
    : 0;

  // Get current card
  const currentSessionCard = sessionCards.length > 0 && currentIndex < sessionCards.length 
    ? sessionCards[currentIndex] 
    : null;
  
  const currentCard = currentSessionCard?.card;

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

  if (sessionCards.length === 0) {
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
              {sessionStats.uniqueCards} unique cards • {sessionCards.length} remaining
              {currentSessionCard && currentSessionCard.repetitions > 0 && 
                ` • Repeat #${currentSessionCard.repetitions + 1}`}
            </p>
            {currentCard && (
              <Badge variant="outline" className="bg-opacity-50">
                {currentSessionCard && currentSessionCard.repetitions > 0 ? 'Learning' : 
                 currentCard.status === 'new' ? 'New Card' : 'Review Card'}
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
              key={`${currentCard.id}-${currentSessionCard?.repetitions}-${isFlipped ? 'back' : 'front'}`}
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
                        {currentCard.tags?.length > 3 && <span className="text-xs">+{currentCard.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 text-sm text-muted-foreground flex items-center gap-2">
                    {getIntervalText(currentCard)}
                    {currentSessionCard && currentSessionCard.repetitions > 0 && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        Rep #{currentSessionCard.repetitions + 1}
                      </Badge>
                    )}
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

      {/* Rating buttons - 3-Level System */}
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
                        onClick={() => handleRate(rating as RatingLevel)}
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
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
              setIsFlipped(false);
              setShowRelatedCards(false);
            }
          }}
          disabled={currentIndex === 0}
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
              <p>Anki-Style Review System</p>
              <p>1 (Hard): Repeat card very soon</p>
              <p>2 (Normal): Repeat card later in session</p>
              <p>3 (Easy): Graduate card from session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline"
          onClick={() => {
            if (currentIndex < sessionCards.length - 1) {
              setCurrentIndex(prev => prev + 1);
              setIsFlipped(false);
              setShowRelatedCards(false);
            }
          }}
          disabled={currentIndex === sessionCards.length - 1}
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
              <div className="text-sm text-muted-foreground">Unique Cards</div>
              <div className="text-xl font-bold">{sessionStats.uniqueCards}</div>
            </div>
            <div>
              <div className="text-sm text-blue-500">Total Reviews</div>
              <div className="text-xl font-bold">{sessionStats.totalReviews}</div>
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