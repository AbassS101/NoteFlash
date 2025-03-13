// src/components/flashcards/review-system-toggle.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ScrollText, ArrowRight, Share2, Badge } from 'lucide-react';
import { migrateToSM2Store } from '@/lib/utils/sm2-utils';
import { useFlashcardStore } from '@/store/flashcard-store';
import { useSM2FlashcardStore } from '@/store/sm2-flashcard-store';
import React from 'react';

export function ReviewSystemToggle({ currentDeck = 'all' }: { currentDeck?: string }) {
  const [activeTab, setActiveTab] = useState<string>('current');
  const [isMigrating, setIsMigrating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Get counts from both stores
  const { getDueFlashcards: getCurrentDue, getNewFlashcards: getCurrentNew } = useFlashcardStore();
  const { getDueFlashcards: getSM2Due, getNewFlashcards: getSM2New } = useSM2FlashcardStore();
  
  const currentDueCount = getCurrentDue(currentDeck).length;
  const currentNewCount = getCurrentNew(currentDeck).length;
  const sm2DueCount = getSM2Due(currentDeck).length;
  const sm2NewCount = getSM2New(currentDeck).length;
  
  // Handle switching to selected review system
  const handleStartReview = () => {
    if (activeTab === 'current') {
      // Store selected deck in session storage
      sessionStorage.setItem('reviewDeck', currentDeck);
      router.push('/review/session');
    } else {
      // Check if there are cards in the SM-2 store
      const sm2Store = useSM2FlashcardStore.getState();
      const deckCards = sm2Store.flashcards.filter(
        card => currentDeck === 'all' || card.deck === currentDeck
      );
      
      if (deckCards.length === 0) {
        // Prompt to migrate cards
        toast({
          title: "No SM-2 flashcards found",
          description: "Would you like to migrate your existing flashcards to the SM-2 system?",
          action: (
            <Button 
                  variant="outline"
                  onClick={() => handleMigrateCards()}
                  className="whitespace-nowrap" size={undefined}            >
              Migrate Cards
            </Button>
          )
        });
        return;
      }
      
      // Store selected deck in session storage
      sessionStorage.setItem('reviewDeck', currentDeck);
      router.push('/review/sm2');
    }
  };
  
  // Handle migrating cards to SM-2 store
  const handleMigrateCards = async () => {
    setIsMigrating(true);
    
    try {
      const { migrated, skipped } = migrateToSM2Store();
      
      toast({
        title: "Migration Successful",
        description: `${migrated} cards migrated, ${skipped} cards skipped.`,
      });
      
      // If we successfully migrated cards, redirect to SM-2 review
      if (migrated > 0) {
        sessionStorage.setItem('reviewDeck', currentDeck);
        router.push('/review/sm2');
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your flashcards.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className={undefined}>
        <CardTitle className={undefined}>Choose Review System</CardTitle>
        <CardDescription className={undefined}>
          Select which spaced repetition system to use for your flashcard review
        </CardDescription>
      </CardHeader>
      <CardContent className={undefined}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="current" className="flex-1">
              <ScrollText className="h-4 w-4 mr-2" />
              Current System
            </TabsTrigger>
            <TabsTrigger value="sm2" className="flex-1">
              <Brain className="h-4 w-4 mr-2" />
              SM-2 Anki Algorithm
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            {activeTab === 'current' ? (
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Current Review System</h3>
                    {currentDueCount + currentNewCount > 0 && (
                      <Badge className="bg-blue-100 dark:bg-blue-900">
                        {currentDueCount + currentNewCount} cards to review
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    The current system uses a 3-level rating (Hard/Normal/Easy) approach with 
                    simplified spacing logic.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded flex justify-between">
                      <span>Due now:</span>
                      <span className="font-medium">{currentDueCount}</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded flex justify-between">
                      <span>New cards:</span>
                      <span className="font-medium">{currentNewCount}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                                  onClick={handleStartReview}
                                  disabled={currentDueCount + currentNewCount === 0}
                                  className="w-full" variant={undefined} size={undefined}                >
                  Start Current Review System
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300">SM-2 Algorithm</h3>
                    {sm2DueCount + sm2NewCount > 0 && (
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                        {sm2DueCount + sm2NewCount} cards to review
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    The SM-2 algorithm uses a 4-point rating scale and is the basis for Anki and other
                    advanced spaced repetition systems. It offers better memory optimization.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-100/70 dark:bg-blue-900/50 p-2 rounded flex justify-between text-blue-800 dark:text-blue-300">
                      <span>Due now:</span>
                      <span className="font-medium">{sm2DueCount}</span>
                    </div>
                    <div className="bg-blue-100/70 dark:bg-blue-900/50 p-2 rounded flex justify-between text-blue-800 dark:text-blue-300">
                      <span>New cards:</span>
                      <span className="font-medium">{sm2NewCount}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                                      onClick={handleStartReview}
                                      disabled={isMigrating}
                                      variant="default"
                                      className="w-full bg-blue-600 hover:bg-blue-700" size={undefined}                >
                  {isMigrating ? "Migrating Cards..." : 
                   sm2DueCount + sm2NewCount > 0 ? "Start SM-2 Review" : "Set Up SM-2 System"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                {sm2DueCount + sm2NewCount === 0 && (
                  <Button 
                                          variant="outline"
                                          onClick={handleMigrateCards}
                                          disabled={isMigrating}
                                          className="w-full" size={undefined}                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Migrate Existing Cards to SM-2
                  </Button>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}