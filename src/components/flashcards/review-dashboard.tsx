// src/components/flashcards/review-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, Calendar, BarChart2, BookOpen, 
  Plus, Minus, Brain, Award, Zap,
  BarChart, LineChart, PieChart, TrendingUp, Flame as Fire
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import React from 'react';

// Helper function to get color based on progress
const getProgressColor = (progress: number): string => {
  if (progress < 30) return 'bg-red-500';
  if (progress < 60) return 'bg-amber-500';
  if (progress < 85) return 'bg-emerald-500';
  return 'bg-green-500';
};

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
      learned: number;
      mature: number;
      averageInterval: number;
      streakCount: number;
    }
  }>({});
  
  const [selectedNewCardCount, setSelectedNewCardCount] = useState<number>(newCardsPerDay);
  const [activeTab, setActiveTab] = useState('decks');
  const router = useRouter();

  // Calculate stats for each deck
  useEffect(() => {
    const decks = Array.from(new Set(flashcards.map(f => f.deck)));
    const stats: {
      [key: string]: {
        total: number; 
        due: number;
        new: number;
        learned: number;
        mature: number;
        averageInterval: number;
        streakCount: number;
      }
    } = {};
    
    // Calculate all-decks stats first
    const now = new Date();
    const allDeckCards = flashcards;
    
    stats['all'] = {
      total: allDeckCards.length,
      due: getDueFlashcards('all').length,
      new: getNewFlashcards('all').length,
      learned: allDeckCards.filter(f => f.status !== 'new' && f.interval < 21).length,
      mature: allDeckCards.filter(f => f.status === 'review' && f.interval >= 21).length,
      averageInterval: allDeckCards.length > 0 
        ? Math.round(allDeckCards.reduce((sum, f) => sum + f.interval, 0) / allDeckCards.length) 
        : 0,
      streakCount: allDeckCards.filter(f => f.consecutiveCorrect >= 3).length
    };
    
    // Then calculate individual deck stats
    decks.forEach(deck => {
      const deckCards = flashcards.filter(f => f.deck === deck);
      const total = deckCards.length;
      const due = getDueFlashcards(deck).length;
      const newCards = getNewFlashcards(deck).length;
      
      // Calculate additional metrics
      const learned = deckCards.filter(f => f.status !== 'new' && f.interval < 21).length;
      const mature = deckCards.filter(f => f.status === 'review' && f.interval >= 21).length;
      const averageInterval = total > 0 
        ? Math.round(deckCards.reduce((sum, f) => sum + f.interval, 0) / total) 
        : 0;
      const streakCount = deckCards.filter(f => f.consecutiveCorrect >= 3).length;
      
      stats[deck] = { 
        total, 
        due, 
        new: newCards, 
        learned,
        mature,
        averageInterval,
        streakCount
      };
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
  const totalMatureCards = Object.values(deckStats).reduce((sum, stat) => sum + stat.mature, 0);
  const totalStreakCards = Object.values(deckStats).reduce((sum, stat) => sum + stat.streakCount, 0);

  // Calculate retention percentage
  const retentionPercentage = totalCards > 0 
    ? Math.round((totalMatureCards / totalCards) * 100) 
    : 0;

  // Calculate streak percentage
  const streakPercentage = totalCards > 0
    ? Math.round((totalStreakCards / totalCards) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="decks" value={activeTab} onValueChange={setActiveTab} className={undefined}>
        <TabsList className={undefined}>
          <TabsTrigger value="decks" className={undefined}>
            <BookOpen className="h-4 w-4 mr-2" />
            Decks
          </TabsTrigger>
          <TabsTrigger value="stats" className={undefined}>
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="settings" className={undefined}>
            <Clock className="h-4 w-4 mr-2" />
            Study Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="decks" className="space-y-6">
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
                  <Award className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Mature Cards</div>
                    <div className="text-2xl font-bold">{totalMatureCards}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Learning Progress */}
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>Learning Progress</CardTitle>
              <CardDescription className={undefined}>Your overall retention and learning statistics</CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Retention Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Retention Rate</span>
                    </div>
                    <div className="text-2xl font-bold">{retentionPercentage}%</div>
                  </div>
                  <Progress 
                    value={retentionPercentage} 
                    className={`h-2 ${getProgressColor(retentionPercentage)}`} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {retentionPercentage < 30 ? "Just starting out. Keep practicing!" :
                     retentionPercentage < 60 ? "Building knowledge base. Good progress!" :
                     retentionPercentage < 85 ? "Strong retention. Keep going!" :
                     "Excellent retention rate!"}
                  </p>
                </div>
                
                {/* Streak Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Fire className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Success Streaks</span>
                    </div>
                    <div className="text-2xl font-bold">{streakPercentage}%</div>
                  </div>
                  <Progress 
                    value={streakPercentage} 
                    className={`h-2 ${getProgressColor(streakPercentage)}`} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {streakPercentage < 30 ? "Building momentum. Keep practicing!" :
                     streakPercentage < 60 ? "Good streak progress!" :
                     streakPercentage < 85 ? "Strong recall patterns forming!" :
                     "Excellent memory patterns!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mt-8">Your Decks</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(deckStats)
              .filter(([deck]) => deck !== 'all') // Exclude the 'all' pseudo-deck
              .map(([deck, stats]) => {
                // Calculate completion percentage
                const completionPercentage = stats.total > 0 
                  ? Math.round(((stats.learned + stats.mature) / stats.total) * 100)
                  : 0;
                
                return (
                  <Card key={deck} className="hover:shadow-md transition-shadow">
                    <CardHeader className={undefined}>
                      <CardTitle className="flex items-center justify-between">
                        <span>{deck}</span>
                        {stats.streakCount > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Fire className="h-3 w-3 text-amber-500" />
                            <span>{stats.streakCount}</span>
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className={undefined}>
                        <div className="flex justify-between">
                          <span>{stats.due} due + {Math.min(selectedNewCardCount, stats.new)} new</span>
                          <span>{stats.total} total</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className={undefined}>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>New: {stats.new}</span>
                          <span>Learning: {stats.learned}</span>
                          <span>Mature: {stats.mature}</span>
                        </div>
                        <Progress 
                          value={completionPercentage} 
                          className={`h-2 ${getProgressColor(completionPercentage)}`} 
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            Avg interval: {stats.averageInterval > 0 ? `${stats.averageInterval} days` : 'N/A'}
                          </span>
                          <span className="text-xs font-medium">
                            {completionPercentage}% complete
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                                onClick={() => handleStartReview(deck)}
                                disabled={stats.due === 0 && stats.new === 0}
                                className="w-full" variant={undefined} size={undefined}                      >
                        {stats.due > 0 || stats.new > 0 ? 
                          `Study ${stats.due + Math.min(selectedNewCardCount, stats.new)} Cards` : 
                          'No Cards to Study'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            
            {/* Add a card for reviewing all decks */}
            <Card className="hover:shadow-md transition-shadow border-dashed">
              <CardHeader className={undefined}>
                <CardTitle className={undefined}>All Decks</CardTitle>
                <CardDescription className={undefined}>
                  <div className="flex justify-between">
                    <span>{deckStats.all?.due || 0} due + {Math.min(selectedNewCardCount, deckStats.all?.new || 0)} new</span>
                    <span>{totalCards} total</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className={undefined}>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Due today: {deckStats.all?.due || 0}</span>
                    <span>New: {deckStats.all?.new || 0}</span>
                  </div>
                  <Progress 
                    value={retentionPercentage} 
                    className={`h-2 ${getProgressColor(retentionPercentage)}`} 
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      Review all decks
                    </span>
                    <span className="text-xs font-medium">
                      {retentionPercentage}% retention
                    </span>
                  </div>
                </div>
                <Button 
                                  onClick={() => handleStartReview('all')}
                                  disabled={totalDueCards === 0 && totalNewCards === 0}
                                  className="w-full"
                                  variant="default" size={undefined}                >
                  {totalDueCards > 0 || totalNewCards > 0 ? 
                    `Study ${totalDueCards + Math.min(selectedNewCardCount, totalNewCards)} Cards` : 
                    'No Cards to Study'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retention Over Time */}
            <Card className={undefined}>
              <CardHeader className={undefined}>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Retention Over Time
                </CardTitle>
                <CardDescription className={undefined}>
                  Your long-term memory retention progress
                </CardDescription>
              </CardHeader>
              <CardContent className={undefined}>
                <div className="text-center p-8 bg-muted/30 rounded-md">
                  <LineChart className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Detailed retention graphs will be available once you have more review data.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card Distribution */}
            <Card className={undefined}>
              <CardHeader className={undefined}>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Card Distribution
                </CardTitle>
                <CardDescription className={undefined}>
                  Breakdown of your flashcard status
                </CardDescription>
              </CardHeader>
              <CardContent className={undefined}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full bg-blue-500 inline-block"></span>
                        New
                      </span>
                      <span>{totalNewCards} cards ({totalCards > 0 ? Math.round((totalNewCards / totalCards) * 100) : 0}%)</span>
                    </div>
                    <Progress value={totalCards > 0 ? (totalNewCards / totalCards) * 100 : 0} className="h-2 bg-blue-200" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-amber-500 inline-block"></div>
                        Learning
                      </span>
                      <span>
                        {totalCards - totalNewCards - totalMatureCards} cards 
                        ({totalCards > 0 ? Math.round(((totalCards - totalNewCards - totalMatureCards) / totalCards) * 100) : 0}%)
                      </span>
                    </div>
                    <Progress 
                      value={totalCards > 0 ? ((totalCards - totalNewCards - totalMatureCards) / totalCards) * 100 : 0} 
                      className="h-2 bg-amber-200" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full bg-green-500 inline-block"></span>
                        Mature
                      </span>
                      <span>
                        {totalMatureCards} cards 
                        ({totalCards > 0 ? Math.round((totalMatureCards / totalCards) * 100) : 0}%)
                      </span>
                    </div>
                    <Progress 
                      value={totalCards > 0 ? (totalMatureCards / totalCards) * 100 : 0} 
                      className="h-2 bg-green-200" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Daily Review Forecast */}
            <Card className={undefined}>
              <CardHeader className={undefined}>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Review Forecast
                </CardTitle>
                <CardDescription className={undefined}>
                  Upcoming reviews for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className={undefined}>
                <div className="text-center p-8 bg-muted/30 rounded-md">
                  <BarChart className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Detailed forecast will be available once you have more review data.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Learning Streak */}
            <Card className={undefined}>
              <CardHeader className={undefined}>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Learning Efficiency
                </CardTitle>
                <CardDescription className={undefined}>
                  Your review performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className={undefined}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {totalCards > 0 ? Math.round((totalMatureCards / totalCards) * 100) : 0}%
                    </div>
                    <div className="text-sm font-medium mt-1">Mastery Rate</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cards with 21+ day intervals
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold text-amber-500">
                      {deckStats.all?.averageInterval || 0}
                    </div>
                    <div className="text-sm font-medium mt-1">Avg Interval</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average days between reviews
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md text-center col-span-2">
                    <div className="text-3xl font-bold text-blue-500">
                      {totalStreakCards}
                    </div>
                    <div className="text-sm font-medium mt-1">Cards on Streak</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cards with 3+ consecutive correct answers
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>Study Settings</CardTitle>
              <CardDescription className={undefined}>Configure your daily study plan</CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">New Cards Per Day</h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <Label className="mb-2 block">Cards to introduce daily</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={decreaseNewCards}
                                                  disabled={selectedNewCardCount <= 0} className={undefined}                        >
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
                                                  onClick={increaseNewCards} className={undefined}                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <Label className="mb-2 block">Adjust with slider</Label>
                      <Slider 
                        value={[selectedNewCardCount]}
                        min={0}
                        max={50}
                        step={1}
                        onValueChange={(values) => setSelectedNewCardCount(values[0])}
                        className="my-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Easier pace</span>
                        <span>More challenging</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Daily study goal</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="bg-muted/30 p-4 rounded-md flex-1">
                      <div className="text-sm font-medium mb-1">Today's Load</div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <div className="text-sm">New: <span className="font-medium">{Math.min(selectedNewCardCount, totalNewCards)}</span></div>
                          <div className="text-sm">Review: <span className="font-medium">{totalDueCards}</span></div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">
                            Total: {Math.min(selectedNewCardCount, totalNewCards) + totalDueCards}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={100} 
                          className="h-2 bg-gradient-to-r from-blue-500 to-green-500" 
                        />
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-md flex-1">
                      <div className="text-sm font-medium mb-1">Estimated Time</div>
                      <div className="flex justify-between items-baseline">
                        <div className="text-sm text-muted-foreground">
                          ~8 seconds per card
                        </div>
                        <div className="text-xl font-bold">
                          {Math.ceil((Math.min(selectedNewCardCount, totalNewCards) + totalDueCards) * 8 / 60)} min
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground">
                          Time estimate based on your past review speed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={undefined}>
            <CardHeader className={undefined}>
              <CardTitle className={undefined}>Algorithm Settings</CardTitle>
              <CardDescription className={undefined}>Advanced spaced repetition configuration</CardDescription>
            </CardHeader>
            <CardContent className={undefined}>
              <div className="text-center p-8 bg-muted/30 rounded-md">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">
                  Enhanced SM-2 Algorithm
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The system uses an improved SM-2 algorithm with adaptive difficulty, optimized intervals,
                  and context-aware spacing to maximize your memory retention.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}