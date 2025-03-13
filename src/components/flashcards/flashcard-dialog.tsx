// src/components/flashcards/flashcard-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFlashcardStore } from '@/store/flashcard-store';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import React from 'react';

interface FlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcardId: string | null;
}

export function FlashcardDialog({ open, onOpenChange, flashcardId }: FlashcardDialogProps) {
  const { flashcards, addFlashcard, updateFlashcard } = useFlashcardStore();
  const { toast } = useToast();
  
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState('Default');
  const [newDeckName, setNewDeckName] = useState('');
  const [isNewDeck, setIsNewDeck] = useState(false);
  const [status, setStatus] = useState<'new' | 'learning' | 'review'>('new');
  const [interval, setInterval] = useState(0);
  const [easeFactor, setEaseFactor] = useState(2.5);
  const [reviewCount, setReviewCount] = useState(0);
  
  // Get unique deck names
  const decks = Array.from(new Set(flashcards.map(f => f.deck)));
  
  // Load flashcard data when editing
  useEffect(() => {
    if (open && flashcardId) {
      const flashcard = flashcards.find(f => f.id === flashcardId);
      if (flashcard) {
        setFront(flashcard.front);
        setBack(flashcard.back);
        setDeck(flashcard.deck);
        setStatus(flashcard.status || 'new');
        setInterval(flashcard.interval || 0);
        setEaseFactor(flashcard.easeFactor || 2.5);
        setReviewCount(flashcard.reviewCount || 0);
        setIsNewDeck(false);
      }
    } else if (open) {
      // Reset form when opening for create
      setFront('');
      setBack('');
      setDeck('Default');
      setNewDeckName('');
      setStatus('new');
      setInterval(0);
      setEaseFactor(2.5);
      setReviewCount(0);
      setIsNewDeck(false);
    }
  }, [open, flashcardId, flashcards]);
  
  const handleDeckChange = (value: string) => {
    if (value === 'new') {
      setIsNewDeck(true);
      setNewDeckName('');
    } else {
      setIsNewDeck(false);
      setDeck(value);
    }
  };
  
  const handleStatusChange = (newStatus: 'new' | 'learning' | 'review') => {
    setStatus(newStatus);
    
    // Adjust interval and other properties based on the status change
    if (newStatus === 'new') {
      setInterval(0);
      setReviewCount(0);
    } else if (newStatus === 'learning' && status === 'new') {
      // If moving from new to learning, set a small interval
      setInterval(1);
      if (reviewCount === 0) {
        setReviewCount(1);
      }
    } else if (newStatus === 'review' && (status === 'new' || status === 'learning')) {
      // If graduating to review, set a longer interval if it's too short
      if (interval < 3) {
        setInterval(3);
      }
      if (reviewCount === 0) {
        setReviewCount(1);
      }
    }
  };
  
  const handleSubmit = () => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    
    if (!trimmedFront || !trimmedBack) {
      toast({
        title: "Validation error",
        description: "Please fill out both sides of the flashcard.",
        variant: "destructive",
      });
      return;
    }
    
    const finalDeck = isNewDeck ? newDeckName.trim() : deck;
    
    if (isNewDeck && !newDeckName.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a name for the new deck.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate the next review date based on the interval
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    if (flashcardId) {
      // Update existing
      updateFlashcard(flashcardId, {
        front: trimmedFront,
        back: trimmedBack,
        deck: finalDeck,
        status: status,
        interval: interval,
        easeFactor: easeFactor,
        reviewCount: reviewCount,
        nextReview: nextReview
      });
      
      toast({
        title: "Flashcard updated",
        description: "Your flashcard has been updated successfully.",
      });
    } else {
      // Create new
      addFlashcard(trimmedFront, trimmedBack, finalDeck);
      
      toast({
        title: "Flashcard created",
        description: "Your flashcard has been created successfully.",
      });
    }
    
    onOpenChange(false);
  };
  
  // Helper to get status badge color
  const getStatusColor = (cardStatus: string) => {
    switch (cardStatus) {
      case 'new': return 'bg-blue-500 hover:bg-blue-600';
      case 'learning': return 'bg-amber-500 hover:bg-amber-600';
      case 'review': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>{flashcardId ? 'Edit Flashcard' : 'Create Flashcard'}</DialogTitle>
          <DialogDescription className={undefined}>
            Create or edit a flashcard for your study sessions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="front" className={undefined}>Front</Label>
            <Textarea
              id="front"
              placeholder="Question or prompt"
              value={front}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setFront(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="back" className={undefined}>Back</Label>
            <Textarea
              id="back"
              placeholder="Answer or explanation"
              value={back}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setBack(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deck" className={undefined}>Deck</Label>
            <Select 
              value={isNewDeck ? 'new' : deck} 
              onValueChange={handleDeckChange}
            >
              <SelectTrigger id="deck" className={undefined}>
                <SelectValue placeholder="Select deck" />
              </SelectTrigger>
              <SelectContent className={undefined}>
                {decks.map(d => (
                  <SelectItem key={d} value={d} className={undefined}>{d}</SelectItem>
                ))}
                <SelectItem value="new" className={undefined}>Create New Deck...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isNewDeck && (
            <div className="grid gap-2">
              <Label htmlFor="new-deck" className={undefined}>New Deck Name</Label>
              <Input
                id="new-deck"
                placeholder="Enter new deck name"
                value={newDeckName}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNewDeckName(e.target.value)} 
                className={undefined} 
                type={undefined}
              />
            </div>
          )}
          
          {flashcardId && (
            <>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status" className={undefined}>Card Status</Label>
                  <Badge className={getStatusColor(status) + " text-white"}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
                <Select 
                  value={status} 
                  onValueChange={(value: 'new' | 'learning' | 'review') => handleStatusChange(value)}
                >
                  <SelectTrigger id="status" className={undefined}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className={undefined}>
                    <SelectItem value="new" className={undefined}>New</SelectItem>
                    <SelectItem value="learning" className={undefined}>Learning</SelectItem>
                    <SelectItem value="review" className={undefined}>Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="interval" className={undefined}>Interval (days)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="0"
                  max="365"
                  value={interval}
                  onChange={(e: { target: { value: string; }; }) => setInterval(parseInt(e.target.value) || 0)}
                  className={undefined}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Days until next review ({interval === 0 ? 'Due now' : `Due in ${interval} days`})
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ease-factor" className={undefined}>Ease Factor</Label>
                  <Input
                    id="ease-factor"
                    type="number"
                    min="1.3"
                    max="3.0"
                    step="0.1"
                    value={easeFactor}
                    onChange={(e: { target: { value: string; }; }) => setEaseFactor(parseFloat(e.target.value) || 2.5)}
                    className={undefined}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="review-count" className={undefined}>Review Count</Label>
                  <Input
                    id="review-count"
                    type="number"
                    min="0"
                    value={reviewCount}
                    onChange={(e: { target: { value: string; }; }) => setReviewCount(parseInt(e.target.value) || 0)}
                    className={undefined}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className={undefined} variant={undefined} size={undefined}>
            {flashcardId ? 'Save Changes' : 'Create Flashcard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}