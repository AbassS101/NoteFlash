// src/components/flashcards/deck-grid.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, PlayCircle } from 'lucide-react';
import { FlashcardDeck } from '@/types/flashcard-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DeckGridProps {
  decks: FlashcardDeck[];
  onDeckClick: (deck: FlashcardDeck) => void;
  onAddDeck: () => void;
  onEditDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onDuplicateDeck: (deckId: string) => void;
  onStudyDeck: (deckId: string) => void;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  decks,
  onDeckClick,
  onAddDeck,
  onEditDeck,
  onDeleteDeck,
  onDuplicateDeck,
  onStudyDeck
}) => {
  // Function to format a timestamp to a readable format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Add new deck card */}
      <Card className="cursor-pointer hover:shadow-md flex flex-col items-center justify-center border-dashed h-full min-h-[200px]" onClick={onAddDeck}>
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-center">Add New Deck</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Create a new flashcard deck
          </p>
        </CardContent>
      </Card>

      {/* Display existing decks */}
      {decks.map((deck) => (
        <Card key={deck.id} className="hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg cursor-pointer" onClick={() => onDeckClick(deck)}>
                {deck.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={undefined}>
                  <DropdownMenuItem onClick={() => onEditDeck(deck)} className={undefined} inset={undefined}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicateDeck(deck.id)} className={undefined} inset={undefined}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={undefined} />
                  <DropdownMenuItem 
                                  onClick={() => onDeleteDeck(deck.id)}
                                  className="text-red-600 focus:text-red-600" inset={undefined}                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent 
            className="cursor-pointer pt-0"
            onClick={() => onDeckClick(deck)}
          >
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
              {deck.description || "No description"}
            </p>
            <div className="flex items-center justify-between mt-4">
              <Badge variant="outline">{deck.cardCount} cards</Badge>
              <span className="text-xs text-muted-foreground">
                Updated {formatDate(deck.updatedAt)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
                      variant="default"
                      className="w-full"
                      onClick={(e: { stopPropagation: () => void; }) => {
                          e.stopPropagation();
                          onStudyDeck(deck.id);
                      } } size={undefined}            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Study
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};