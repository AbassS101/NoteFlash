"use client";

import React, { useState } from 'react';
import { useSM2FlashcardStore } from '@/store/sm2-flashcard-store';
import { SM2Quality } from '@/lib/sm2';
import { toSM2Quality } from '@/lib/sm2/quality-converter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SM2FlashcardsPage() {
  const { flashcards, reviewFlashcard } = useSM2FlashcardStore();
  const [flipped, setFlipped] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Get all due flashcards
  const dueFlashcards = flashcards.filter(card => {
    const now = new Date();
    return now >= new Date(card.nextReview);
  });

  const currentCard = dueFlashcards[currentCardIndex];

  // Handle card flip
  const handleFlip = (id: string) => {
    setFlipped(flipped === id ? null : id);
  };

  // Handle quality rating selection
  // IMPORTANT: Convert the number to SM2Quality enum using toSM2Quality
  const handleRateCard = (cardId: string, qualityRating: number) => {
    // Convert the number to SM2Quality enum type
    const qualityEnum = toSM2Quality(qualityRating);
    
    // Now pass the properly typed quality to the review function
    reviewFlashcard(cardId, qualityEnum);
    
    // Reset flip state and move to next card
    setFlipped(null);
    setCurrentCardIndex((prev) => (prev + 1) % dueFlashcards.length);
  };

  if (dueFlashcards.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Flashcard Review</h1>
        <div className="p-6 bg-gray-100 rounded-lg text-center">
          <p className="text-lg">No flashcards due for review!</p>
          <p className="text-gray-600 mt-2">Check back later or add more flashcards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Flashcard Review</h1>
      <div className="mb-4 text-sm text-gray-600">
        {currentCardIndex + 1} of {dueFlashcards.length} cards due
      </div>

      {currentCard && (
        <div className="space-y-8">
          <Card 
            className="p-8 h-64 flex items-center justify-center cursor-pointer text-center"
            onClick={() => handleFlip(currentCard.id)}
          >
            <div className="text-xl">
              {flipped === currentCard.id ? currentCard.back : currentCard.front}
            </div>
          </Card>

          {flipped === currentCard.id && (
            <div className="grid grid-cols-3 gap-4">
              {/* Using toSM2Quality inside the click handler */}
              <Button 
                              variant="outline"
                              className="p-4"
                              onClick={() => handleRateCard(currentCard.id, 1)} size={undefined}              >
                Hard
              </Button>
              <Button 
                              variant="outline"
                              className="p-4"
                              onClick={() => handleRateCard(currentCard.id, 3)} size={undefined}              >
                Good
              </Button>
              <Button 
                              variant="outline"
                              className="p-4"
                              onClick={() => handleRateCard(currentCard.id, 5)} size={undefined}              >
                Easy
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}