import React, { useState, useEffect } from 'react';
import { useFlashcardStore, Flashcard } from '../../store/flashcard-store';
import { useNoteStore } from '../../store/note-store';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  BarChart, 
  PieChart, 
  Calendar
} from 'lucide-react'; 

const ReviewDashboard: React.FC = () => {
  const { flashcards, getDueFlashcards, updateFlashcardReview } = useFlashcardStore();
  const { notes } = useNoteStore();
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<boolean>(false);
  const [reviewStats, setReviewStats] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
    completed: 0
  });

  // Initialize due flashcards
  useEffect(() => {
    const due = getDueFlashcards();
    setDueFlashcards(due);
    setReviewStats(prev => ({
      ...prev,
      total: due.length
    }));
  }, [flashcards, getDueFlashcards]);

  const getNoteTitle = (noteId: string): string => {
    const note = notes.find(n => n.id === noteId);
    return note ? note.title : 'Unknown Note';
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDifficultyRating = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (currentFlashcardIndex >= dueFlashcards.length) return;
    
    const currentCard = dueFlashcards[currentFlashcardIndex];
    updateFlashcardReview(currentCard.id, difficulty);
    
    // Update stats
    setReviewStats(prev => ({
      ...prev,
      [difficulty]: prev[difficulty] + 1,
      completed: prev.completed + 1
    }));
    
    // Move to next card
    setIsFlipped(false);
    setCurrentFlashcardIndex(prev => prev + 1);
  };

  const startReview = () => {
    setReviewMode(true);
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    setReviewStats({
      easy: 0,
      medium: 0,
      hard: 0,
      total: dueFlashcards.length,
      completed: 0
    });
  };

  const resetReview = () => {
    setReviewMode(false);
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderDashboard = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Review Summary</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Total Flashcards</p>
              <p className="text-2xl font-bold">{flashcards.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-2xl font-bold">{dueFlashcards.length}</p>
            </div>
          </div>
          
          {dueFlashcards.length > 0 ? (
            <Button onClick={startReview} className="w-full" variant={undefined} size={undefined}>
              Start Review Session
            </Button>
          ) : (
            <p className="text-center text-gray-500">No flashcards due for review!</p>
          )}
        </Card>
        
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Upcoming Reviews</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {flashcards
              .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())
              .slice(0, 5)
              .map(card => (
                <div key={card.id} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium truncate max-w-48">{card.front}</p>
                    <p className="text-xs text-gray-500">{getNoteTitle(card.noteId)}</p>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-xs">{formatDate(card.nextReviewDate)}</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderReviewMode = () => {
    const currentCard = dueFlashcards[currentFlashcardIndex];
    const isReviewComplete = currentFlashcardIndex >= dueFlashcards.length;
    
    if (isReviewComplete) {
      return (
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Review Complete!</h2>
          
          <div className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Easy</span>
              <span>{reviewStats.easy}</span>
            </div>
            <Progress value={(reviewStats.easy / reviewStats.total) * 100} className="h-2 bg-gray-200" />
            
            <div className="flex justify-between items-center">
              <span>Medium</span>
              <span>{reviewStats.medium}</span>
            </div>
            <Progress value={(reviewStats.medium / reviewStats.total) * 100} className="h-2 bg-gray-200" />
            
            <div className="flex justify-between items-center">
              <span>Hard</span>
              <span>{reviewStats.hard}</span>
            </div>
            <Progress value={(reviewStats.hard / reviewStats.total) * 100} className="h-2 bg-gray-200" />
          </div>
          
          <Button onClick={resetReview} className="w-full" variant={undefined} size={undefined}>
            Return to Dashboard
          </Button>
        </Card>
      );
    }
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={resetReview} size="sm" className={undefined}>
            Exit Review
          </Button>
          <div className="text-sm">
            {currentFlashcardIndex + 1} / {dueFlashcards.length}
          </div>
        </div>
        
        <Card 
          className={`p-8 min-h-64 flex flex-col justify-between cursor-pointer transition-transform duration-500 ${
            isFlipped ? 'bg-gray-50' : ''
          }`}
          onClick={handleFlip}
        >
          <div className="mb-2">
            <Badge variant="outline" className="mb-4">
              {getNoteTitle(currentCard.noteId)}
            </Badge>
            
            <div className="text-xl font-medium">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>
          </div>
          
          <div className="text-sm text-gray-500 text-center mt-8">
            {isFlipped ? 'Click to see front' : 'Click to see back'}
          </div>
        </Card>
        
        {isFlipped && (
          <div className="flex justify-between mt-4 gap-2">
            <Button 
              variant="outline"
              className="flex-1 border-red-300 hover:bg-red-50"
              onClick={() => handleDifficultyRating('hard')} size={undefined}            >
              Hard
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-yellow-300 hover:bg-yellow-50"
              onClick={() => handleDifficultyRating('medium')} size={undefined}            >
              Medium
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-green-300 hover:bg-green-50"
              onClick={() => handleDifficultyRating('easy')} size={undefined}            >
              Easy
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Flashcard Review</h2>
      {reviewMode ? renderReviewMode() : renderDashboard()}
    </div>
  );
};

export default ReviewDashboard;