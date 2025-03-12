// src/components/flashcards/flashcard-grid.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Filter, Clock, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FlashcardDialog } from './flashcard-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export function FlashcardGrid() {
  const { flashcards, deleteFlashcard, fetchFlashcards } = useFlashcardStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [currentDeck, setCurrentDeck] = useState<string>('all');
  const { toast } = useToast();
  const confirm = useConfirm();

  // Get unique deck names for the dropdown filter
  const availableDecks = Array.from(new Set(flashcards.map(card => card.deck)));
  
  // Fetch flashcards on component mount
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Filter flashcards by deck
  const filteredFlashcards = currentDeck === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.deck === currentDeck);

  // Format for displaying next review date in a user-friendly way
  const formatNextReview = (date: Date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffDays = Math.round((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Due now';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
    return `${Math.round(diffDays / 30)} months`;
  };

  const handleEditCard = (id: string) => {
    setEditingCard(id);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteCard = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete flashcard",
      description: "Are you sure you want to delete this flashcard? This action cannot be undone.",
    });

    if (confirmed) {
      deleteFlashcard(id);
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been deleted successfully.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Flashcards</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <Filter className="h-4 w-4 mr-2" />
                {currentDeck === 'all' ? 'All Decks' : currentDeck}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={undefined}>
              <DropdownMenuItem
                onClick={() => setCurrentDeck('all')}
                className={currentDeck === 'all' ? "bg-muted" : ""} inset={undefined}              >
                All Decks
              </DropdownMenuItem>
              {availableDecks.map(deck => (
                <DropdownMenuItem 
                  key={deck}
                  onClick={() => setCurrentDeck(deck)}
                  className={currentDeck === deck ? "bg-muted" : ""} inset={undefined}                >
                  {deck}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => { setEditingCard(null); setIsCreateDialogOpen(true); } } className={undefined} variant={undefined} size={undefined}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Flashcard
        </Button>
      </div>

      {filteredFlashcards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
          <div className="mb-4 text-5xl text-muted-foreground">
            <PlusCircle strokeWidth={1} />
          </div>
          <h3 className="text-xl font-medium mb-2">No flashcards found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first flashcard by clicking the "Create Flashcard" button above.
          </p>
          <Button onClick={() => { setEditingCard(null); setIsCreateDialogOpen(true); } } className={undefined} variant={undefined} size={undefined}>
            Create Flashcard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlashcards.map(card => (
            <Card key={card.id} className="flex flex-col h-full transform transition-all duration-200 hover:shadow-md hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <div className="truncate pr-4">{card.front}</div>
                  <Badge variant="outline">{card.deck}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 flex-grow">
                <CardDescription className="line-clamp-3">{card.back}</CardDescription>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Next review: {formatNextReview(card.nextReview)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditCard(card.id)} className={undefined}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(card.id)} className={undefined}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <FlashcardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        flashcardId={editingCard}
      />
    </div>
  );
}