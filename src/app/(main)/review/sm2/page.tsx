// src/app/(main)/review/sm2/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SM2ReviewSession } from '@/components/flashcards/sm2-review-session';
import { useSM2FlashcardStore, RATING_TO_QUALITY } from '@/store/sm2-flashcard-store';
import { 
  ArrowLeft, CalendarRange, BookOpen, 
  Brain, Gauge, BarChart2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export default function SM2ReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    flashcards, 
    getDueFlashcards, 
    getNewFlashcards,
    reviewFlashcard,
    newCardsPerDay,
    currentReviewDeck,
    setCurrentReviewDeck
  } = useSM2FlashcardStore();
  
  const [reviewCards, setReviewCards] = useState<any[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({
    dueCards: 0,
    newCards: 0,
    cardsReviewed: 0,
    avgEaseFactor: 0
  });
  
  // Load flashcards to review on component mount
  useEffect(() => {
    // Use data from sessionStorage if coming from dashboard
    const storedDeck = sessionStorage.getItem('reviewDeck');
    if (storedDeck) {
      setCurrentReviewDeck(storedDeck);
      sessionStorage.removeItem('reviewDeck');
    }
    
    prepareSession();
  }, [currentReviewDeck]);
  
  // Prepare the review session by collecting due and new cards
  const prepareSession = () => {
    const dueCards = getDueFlashcards(currentReviewDeck);
    const newCards = getNewFlashcards(currentReviewDeck, newCardsPerDay);
    
    // Calculate average ease factor
    const totalEaseFactor = flashcards.reduce((sum, card) => sum + card.easeFactor, 0);
    const avgEaseFactor = flashcards.length > 0 ? 
      (totalEaseFactor / flashcards.length).toFixed(2) : 
      "2.50";
    
    setStats({
      dueCards: dueCards.length,
      newCards: newCards.length,
      cardsReviewed: 0,
      avgEaseFactor: parseFloat(avgEaseFactor)
    });
    
    // Create a mixed deck of cards to review
    // Start with some due cards, then interleave new cards
    const mixed = [];
    const maxInitialDue = Math.min(dueCards.length, 5);
    
    // Add initial due cards
    for (let i = 0; i < maxInitialDue; i++) {
      mixed.push(dueCards[i]);
    }
    
    // Interleave remaining cards (4 due : 1 new ratio if possible)
    let dueIndex = maxInitialDue;
    let newIndex = 0;
    
    while (dueIndex < dueCards.length || newIndex < newCards.length) {
      // Add up to 4 due cards
      for (let i = 0; i < 4 && dueIndex < dueCards.length; i++, dueIndex++) {
        mixed.push(dueCards[dueIndex]);
      }
      
      // Add 1 new card
      if (newIndex < newCards.length) {
        mixed.push(newCards[newIndex]);
        newIndex++;
      }
    }
    
    setReviewCards(mixed);
  };
  
  // Handle starting the review session
  const startSession = () => {
    if (reviewCards.length === 0) {
      toast({
        title: "No cards to review",
        description: "You're all caught up! There are no cards due for review."
      });
      return;
    }
    
    setSessionStarted(true);
  };
  
  // Handle individual card review
  const handleCardReviewed = (card: any, quality: number) => {
    // Call the SM-2 algorithm implementation in the store
    reviewFlashcard(card.id, quality);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      cardsReviewed: prev.cardsReviewed + 1
    }));
  };
  
  // Handle completion of the review session
  const handleReviewComplete = (reviewedCards: any[]) => {
    setSessionComplete(true);
    
    // Calculate updated stats after all reviews
    const totalEaseFactor = flashcards.reduce((sum, card) => sum + card.easeFactor, 0);
    const avgEaseFactor = flashcards.length > 0 ? 
      (totalEaseFactor / flashcards.length).toFixed(2) : 
      "2.50";
    
    setStats(prev => ({
      ...prev,
      avgEaseFactor: parseFloat(avgEaseFactor)
    }));
    
    toast({
      title: "Review session complete!",
      description: `You've reviewed ${reviewedCards.length} cards. Great job!`,
    });
  };
  
  // Calculate progress percentage
  const progressPercent = stats.dueCards + stats.newCards > 0 
    ? Math.round((stats.cardsReviewed / (stats.dueCards + stats.newCards)) * 100)
    : 0;

  // Show summary view if session is complete
  if (sessionComplete) {
    return (
      <div className="container mx-auto max-w-4xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Review Complete</h1>
          <Button variant="outline" onClick={() => router.push('/review')} className={undefined} size={undefined}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Session Summary
              </CardTitle>
              <CardDescription className={undefined}>
                Your spaced repetition progress
              </CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.cardsReviewed} of {stats.dueCards + stats.newCards} cards
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-md text-center">
                    <Brain className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-2xl font-bold">{stats.cardsReviewed}</div>
                    <div className="text-xs text-muted-foreground">Cards Reviewed</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-md text-center">
                    <Gauge className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-2xl font-bold">{stats.avgEaseFactor}</div>
                    <div className="text-xs text-muted-foreground">Avg. Ease Factor</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" />
                What's Next
              </CardTitle>
              <CardDescription className={undefined}>
                Your upcoming reviews
              </CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Based on the SM-2 algorithm, your cards have been scheduled for optimal memory retention.
                </p>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Tomorrow</span>
                    <span className="text-sm">{getDueFlashcards(currentReviewDeck, 0, 1).length} cards</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Next 7 days</span>
                    <span className="text-sm">{getDueFlashcards(currentReviewDeck, 0, 7).length} cards</span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={() => {
                                    setSessionStarted(false);
                                    setSessionComplete(false);
                                    prepareSession();
                                } } className={undefined} variant={undefined} size={undefined}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review More Cards
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show review session if started
  if (sessionStarted) {
    return (
      <div className="container mx-auto max-w-6xl py-4">
        <SM2ReviewSession 
          flashcards={reviewCards}
          onCardReviewed={handleCardReviewed}
          onReviewComplete={handleReviewComplete}
        />
      </div>
    );
  }

  // Show session setup/dashboard
  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SM-2 Spaced Repetition</h1>
        <Button variant="outline" onClick={() => router.push('/review')} className={undefined} size={undefined}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <Card className={undefined}>
        <CardHeader className={undefined}>
          <CardTitle className={undefined}>Today's Review Session</CardTitle>
          <CardDescription className={undefined}>
            Using the SM-2 algorithm for optimal memory retention
          </CardDescription>
        </CardHeader>
        <CardContent className={undefined}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-4 rounded-md text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Due Cards</div>
                <div className="text-3xl font-bold">{stats.dueCards}</div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-md text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">New Cards</div>
                <div className="text-3xl font-bold">{stats.newCards}</div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-md text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total</div>
                <div className="text-3xl font-bold">{stats.dueCards + stats.newCards}</div>
              </div>
            </div>
            
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950">
              <h3 className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-300">About SM-2 Algorithm</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                The SM-2 algorithm optimizes your learning by scheduling reviews at increasing intervals.
                Cards are shown right before you're likely to forget them, strengthening your memory efficiently.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                              onClick={startSession}
                              disabled={stats.dueCards + stats.newCards === 0}
                              className="px-8" variant={undefined} size={undefined}              >
                {stats.dueCards + stats.newCards > 0 ? 
                  `Start Review Session (${stats.dueCards + stats.newCards} cards)` : 
                  'No Cards to Review'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={undefined}>
          <CardHeader className={undefined}>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Rating System:</h3>
              <ul className="text-sm space-y-1">
                <li><span className="font-medium text-red-500">Again (1):</span> Complete blackout, reset card</li>
                <li><span className="font-medium text-orange-500">Hard (2):</span> Incorrect, but recognized answer</li>
                <li><span className="font-medium text-blue-500">Good (3):</span> Correct answer with some effort</li>
                <li><span className="font-medium text-green-500">Easy (5):</span> Perfect, easy recall</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Interval Calculation:</h3>
              <p className="text-sm">The next review interval is calculated based on:</p>
              <ul className="text-sm list-disc pl-5 space-y-1 mt-1">
                <li>Your rating of the card (quality)</li>
                <li>Previous interval</li>
                <li>Ease factor (adjusted with each review)</li>
                <li>Number of consecutive correct reviews</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardHeader className={undefined}>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Ease Factor:</span>
                <span className="font-medium">{stats.avgEaseFactor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Flashcards:</span>
                <span className="font-medium">{flashcards.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cards in Learning:</span>
                <span className="font-medium">
                  {flashcards.filter(c => c.status === 'learning').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mature Cards:</span>
                <span className="font-medium">
                  {flashcards.filter(c => c.status === 'review' && c.interval >= 21).length}
                </span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md">
              <span className="text-xs text-muted-foreground">
                A higher ease factor means cards are easier for you to remember.
                The algorithm personalizes intervals based on your performance.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}