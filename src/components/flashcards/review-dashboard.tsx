// src/components/flashcards/review-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, BarChart2, BookOpen, Plus, Minus, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import React from 'react';

export function ReviewDashboard() {
  const { 
    flashcards, 
    getDueFlashcards, 
    getNewFlashcards,
    getReviewStats,
    newCardsPerDay,
    setNewCardsPerDay
  } = useFlashcardStore();
  
  const [deckStats, setDeckStats] = useState<{
    [key: string]: {
      total: number; 
      due: number;
      new: number;
    }
  }>({});
  
  const [selectedNewCardCount, setSelectedNewCardCount] = useState<number>(newCardsPerDay);
  const router = useRouter();

  // Calculate stats for each deck
  useEffect(() => {
    const decks = Array.from(new Set(flashcards.map(f => f.deck)));
    const stats: {[key: string]: {total: number; due: number; new: number}} = {};
    
    decks.forEach(deck => {
      const total = flashcards.filter(f => f.deck === deck).length;
      const due = getDueFlashcards(deck).length;
      const newCards = getNewFlashcards(deck).length;
      stats[deck] = { total, due, new: newCards };
    });
    
    setDeckStats(stats);
    
    // Initialize selected count from store value
    setSelectedNewCardCount(newCardsPerDay);
  }, [flashcards, getDueFlashcards, getNewFlashcards, newCardsPerDay]);

  const handleStartReview = (deck: string) => {
    // Save the selected new card count to the store
    setNewCardsPerDay(selectedNewCardCount);
    
    // Store selected deck and settings in session storage for the review component to use
    sessionStorage.setItem('reviewDeck', deck);
    sessionStorage.setItem('newCardCount', selectedNewCardCount.toString());
    router.push('/review/session');
  };

  // Handle increasing/decreasing new card count
  const increaseNewCards = () => {
    setSelectedNewCardCount(prev => prev + 5);
  };

  const decreaseNewCards = () => {
    setSelectedNewCardCount(prev => Math.max(0, prev - 5));
  };

  // Calculate total due cards and new cards across all decks
  const totalDueCards = Object.values(deckStats).reduce((sum, stat) => sum + stat.due, 0);
  const totalNewCards = Object.values(deckStats).reduce((sum, stat) => sum + stat.new, 0);
  const totalCards = flashcards.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={undefined}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Cards</div>
                <div className="text-2xl font-bold">{totalCards}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Due Today</div>
                <div className="text-2xl font-bold">{totalDueCards}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-indigo-500" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">New Cards</div>
                <div className="text-2xl font-bold">{totalNewCards}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={undefined}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Retention</div>
                <div className="text-2xl font-bold">
                  {totalCards > 0 ? `${Math.round((1 - (totalDueCards / totalCards)) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* New Cards Configuration */}
      <Card className={undefined}>
        <CardHeader className={undefined}>
          <CardTitle className={undefined}>Study Settings</CardTitle>
          <CardDescription className={undefined}>Configure your daily study plan</CardDescription>
        </CardHeader>
        <CardContent className={undefined}>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">New cards per day</Label>
              <div className="flex items-center gap-2">
                <Button 
                                  variant="outline"
                                  size="icon"
                                  onClick={decreaseNewCards}
                                  disabled={selectedNewCardCount <= 0} className={undefined}                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input 
                  type="number" 
                  value={selectedNewCardCount}
                  min={0}
                  max={100}
                  onChange={(e: { target: { value: string; }; }) => setSelectedNewCardCount(parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                
                <Button 
                                  variant="outline"
                                  size="icon"
                                  onClick={increaseNewCards} className={undefined}                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1">
              <Label className="mb-2 block">Daily study goal</Label>
              <div className="flex items-center gap-2">
                <div className="flex justify-between w-full">
                  <div>
                    <div className="text-sm font-medium">New: {Math.min(selectedNewCardCount, totalNewCards)}</div>
                    <div className="text-sm font-medium">Review: {totalDueCards}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-right">
                      Total: {Math.min(selectedNewCardCount, totalNewCards) + totalDueCards}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decks */}
      <h2 className="text-xl font-bold mt-8">Your Decks</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(deckStats).map(([deck, stats]) => (
          <Card key={deck} className="hover:shadow-md transition-shadow">
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>{deck}</CardTitle>
              <CardDescription className={undefined}>
                <div className="flex justify-between">
                  <span>{stats.due} due + {Math.min(selectedNewCardCount, stats.new)} new</span>
                  <span>{stats.total} total</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Review: {stats.due}</span>
                <span>New: {Math.min(selectedNewCardCount, stats.new)}</span>
              </div>
              <Progress 
                value={(stats.total - stats.due) / stats.total * 100} 
                className="h-2 mb-4" 
              />
              <Button 
                        onClick={() => handleStartReview(deck)}
                        disabled={stats.due === 0 && stats.new === 0}
                        className="w-full" variant={undefined} size={undefined}              >
                {stats.due > 0 || stats.new > 0 ? 
                  `Study ${stats.due + Math.min(selectedNewCardCount, stats.new)} Cards` : 
                  'No Cards to Study'}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {/* Add a card for reviewing all decks */}
        <Card className="hover:shadow-md transition-shadow border-dashed">
          <CardHeader className={undefined}>
            <CardTitle className={undefined}>All Decks</CardTitle>
            <CardDescription className={undefined}>
              <div className="flex justify-between">
                <span>{totalDueCards} due + {Math.min(selectedNewCardCount, totalNewCards)} new</span>
                <span>{totalCards} total</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className={undefined}>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Review: {totalDueCards}</span>
              <span>New: {Math.min(selectedNewCardCount, totalNewCards)}</span>
            </div>
            <Progress 
              value={(totalCards - totalDueCards) / totalCards * 100} 
              className="h-2 mb-4" 
            />
            <Button 
                          onClick={() => handleStartReview('all')}
                          disabled={totalDueCards === 0 && totalNewCards === 0}
                          className="w-full"
                          variant="default" size={undefined}            >
              {totalDueCards > 0 || totalNewCards > 0 ? 
                `Study ${totalDueCards + Math.min(selectedNewCardCount, totalNewCards)} Cards` : 
                'No Cards to Study'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}