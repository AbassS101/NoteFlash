// src/components/quizzes/quiz-grid.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quiz-store';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, HelpCircle, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { confirmDialog } from '@/components/ui/confirm-dialog';
import React from 'react';

export function QuizGrid() {
  const router = useRouter();
  const { quizzes, createQuiz, deleteQuiz, fetchQuizzes } = useQuizStore();
  const { flashcards } = useFlashcardStore();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('flashcards');
  const [deck, setDeck] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  
  // Get available decks
  const availableDecks = ['all', ...Array.from(new Set(flashcards.map(f => f.deck)))];
  
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);
  
  const handleCreateQuiz = () => {
    if (!title.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a quiz title.",
        variant: "destructive",
      });
      return;
    }
    
    if (source === 'flashcards') {
      // Get flashcards for selected deck
      const deckFlashcards = deck === 'all' 
        ? flashcards 
        : flashcards.filter(f => f.deck === deck);
      
      if (deckFlashcards.length === 0) {
        toast({
          title: "No flashcards available",
          description: "There are no flashcards in the selected deck to create a quiz from.",
          variant: "destructive",
        });
        return;
      }
      
      if (deckFlashcards.length < questionCount) {
        toast({
          title: "Not enough flashcards",
          description: `The selected deck only has ${deckFlashcards.length} flashcards. Reducing question count.`,
        });
        setQuestionCount(deckFlashcards.length);
      }
      
      // Shuffle and select flashcards
      const shuffled = [...deckFlashcards].sort(() => 0.5 - Math.random());
      const selectedFlashcards = shuffled.slice(0, Math.min(questionCount, deckFlashcards.length));
      
      // Create questions from flashcards
      const questions = selectedFlashcards.map(card => {
        // Get 3 random incorrect answers
        const incorrectOptions = deckFlashcards
          .filter(f => f.id !== card.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(f => f.back);
        
        const options = [...incorrectOptions, card.back].sort(() => 0.5 - Math.random());
        
        return {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          text: card.front,
          options,
          correctAnswer: card.back,
        };
      });
      
      // Create the quiz
      createQuiz(title, description, questions, timeLimit);
      
      toast({
        title: "Quiz created",
        description: `Quiz "${title}" has been created with ${questions.length} questions.`,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
    } else {
      // For now, just show a message for other sources
      toast({
        title: "Coming soon",
        description: `Creating quizzes from ${source} will be available in a future update.`,
      });
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSource('flashcards');
    setDeck('all');
    setQuestionCount(10);
    setTimeLimit(15);
  };
  
  const handleDeleteQuiz = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Delete quiz",
      description: "Are you sure you want to delete this quiz? This action cannot be undone.",
    });
    
    if (confirmed) {
      deleteQuiz(id);
      toast({
        title: "Quiz deleted",
        description: "The quiz has been deleted successfully.",
      });
    }
  };
  
  const formatDateRelative = (date: Date) => {
    const now = new Date();
    const quizDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - quizDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quizzes</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className={undefined} variant={undefined} size={undefined}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>
      
      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
          <div className="mb-4 text-5xl text-muted-foreground">
            <HelpCircle strokeWidth={1} />
          </div>
          <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first quiz by clicking the "Create Quiz" button above.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className={undefined} variant={undefined} size={undefined}>
            Create Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <Card key={quiz.id} className="flex flex-col h-full transform transition-all duration-200 hover:shadow-md hover:-translate-y-1">
              <CardHeader className={undefined}>
                <CardTitle className={undefined}>{quiz.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{quiz.questions.length} questions</span>
                  <span>•</span>
                  <span>{quiz.timeLimit} min</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                  {quiz.description || 'No description'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {quiz.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {quiz.tags.length === 0 && (
                    <Badge variant="outline" className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      Quiz
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {quiz.lastTaken 
                      ? `Last taken: ${formatDateRelative(quiz.lastTaken)}` 
                      : 'Never taken'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    className="h-8 w-8" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuiz(quiz.id);
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                  <Button 
                              onClick={() => router.push(`/quizzes/${quiz.id}`)} className={undefined} variant={undefined} size={undefined}                  >
                    Start Quiz
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className={undefined}>
            <DialogTitle className={undefined}>Create Quiz</DialogTitle>
            <DialogDescription className={undefined}>
              Create a new quiz to test your knowledge.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className={undefined}>Quiz Title</Label>
              <Input
                              id="title"
                              placeholder="Enter quiz title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)} className={undefined} type={undefined}              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className={undefined}>Description</Label>
              <Textarea
                id="description"
                placeholder="Enter quiz description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label className={undefined}>Source</Label>
              <RadioGroup value={source} onValueChange={setSource} className={undefined}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flashcards" id="flashcards" className={undefined} />
                  <Label htmlFor="flashcards" className={undefined}>From Flashcards</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" className={undefined} />
                  <Label htmlFor="manual" className={undefined}>Create Manually</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="notes" id="notes" className={undefined} />
                  <Label htmlFor="notes" className={undefined}>Generate from Notes</Label>
                </div>
              </RadioGroup>
            </div>
            
            {source === 'flashcards' && (
              <div className="grid gap-2">
                <Label htmlFor="deck" className={undefined}>Deck</Label>
                <Select value={deck} onValueChange={setDeck}>
                  <SelectTrigger id="deck" className={undefined}>
                    <SelectValue placeholder="Select deck" />
                  </SelectTrigger>
                  <SelectContent className={undefined}>
                    <SelectItem value="all" className={undefined}>All Decks</SelectItem>
                    {availableDecks.filter(d => d !== 'all').map(d => (
                      <SelectItem key={d} value={d} className={undefined}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="question-count" className={undefined}>Number of Questions</Label>
              <Input
                              id="question-count"
                              type="number"
                              min="1"
                              max="50"
                              value={questionCount}
                              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)} className={undefined}              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time-limit" className={undefined}>Time Limit (minutes)</Label>
              <Input
                              id="time-limit"
                              type="number"
                              min="1"
                              max="120"
                              value={timeLimit}
                              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 15)} className={undefined}              />
            </div>
          </div>
          
          <DialogFooter className={undefined}>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className={undefined} size={undefined}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} className={undefined} variant={undefined} size={undefined}>
              Create Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}