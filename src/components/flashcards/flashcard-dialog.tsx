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
        setIsNewDeck(false);
      }
    } else if (open) {
      // Reset form when opening for create
      setFront('');
      setBack('');
      setDeck('Default');
      setNewDeckName('');
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
    
    if (flashcardId) {
      // Update existing
      updateFlashcard(flashcardId, {
        front: trimmedFront,
        back: trimmedBack,
        deck: finalDeck,
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
              onChange={(e) => setFront(e.target.value)}
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
              onChange={(e) => setBack(e.target.value)}
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
                  <SelectItem key={d} value={d} className={undefined} >{d}</SelectItem>
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
                              onChange={(e) => setNewDeckName(e.target.value)} className={undefined} type={undefined}              />
            </div>
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