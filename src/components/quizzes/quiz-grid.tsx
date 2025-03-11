'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Clock, Plus, HelpCircle, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React from 'react';

export function QuizGrid() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('flashcards');
  const [deck, setDeck] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  
  // Mock quiz data (replace with your actual data source)
  const quizzes = [
    {
      id: "quiz1",
      title: "Basic JavaScript",
      description: "Test your knowledge of JavaScript fundamentals",
      questions: [
        {id: "q1", text: "What is JavaScript?", options: ["A programming language", "A markup language", "A styling language", "A database"], correctAnswer: "A programming language"},
        {id: "q2", text: "What does DOM stand for?", options: ["Document Object Model", "Data Object Model", "Document Oriented Model", "Digital Output Method"], correctAnswer: "Document Object Model"},
      ],
      timeLimit: 15,
      lastTaken: new Date('2023-10-15'),
      timesCompleted: 3,
      bestScore: 80,
      tags: ["JavaScript", "Web Development"]
    },
    {
      id: "quiz2",
      title: "React Basics",
      description: "Test your knowledge of React fundamentals",
      questions: [
        {id: "q1", text: "What is React?", options: ["A JavaScript library", "A programming language", "A database", "An operating system"], correctAnswer: "A JavaScript library"},
        {id: "q2", text: "What is JSX?", options: ["JavaScript XML", "JavaScript Extension", "JavaScript XHR", "JavaScript Extra"], correctAnswer: "JavaScript XML"},
      ],
      timeLimit: 10,
      lastTaken: new Date('2023-11-05'),
      timesCompleted: 2,
      bestScore: 75,
      tags: ["React", "JavaScript", "Frontend"]
    }
  ];
  
  // Available decks (in real app, would come from your flashcard store)
  const availableDecks = ['General', 'JavaScript', 'React', 'Python'];
  
  const handleCreateQuiz = () => {
    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }
    
    // In a real app, you would create the quiz here
    alert(`Creating quiz: ${title}`);
    
    setIsCreateDialogOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSource('flashcards');
    setDeck('all');
    setQuestionCount(10);
    setTimeLimit(15);
  };
  
  const handleDeleteQuiz = (id: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      // In a real app, you would delete the quiz here
      alert(`Deleting quiz: ${id}`);
    }
  };
  
  const formatDateRelative = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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
                    onClick={(e: { stopPropagation: () => void; }) => {
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
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setTitle(e.target.value)} className={undefined} type={undefined}              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className={undefined}>Description</Label>
              <Textarea
                id="description"
                placeholder="Enter quiz description (optional)"
                value={description}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setDescription(e.target.value)}
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
                    {availableDecks.map(d => (
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
                onChange={(e: { target: { value: string; }; }) => setQuestionCount(parseInt(e.target.value) || 10)} className={undefined}              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time-limit" className={undefined}>Time Limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                min="1"
                max="120"
                value={timeLimit}
                onChange={(e: { target: { value: string; }; }) => setTimeLimit(parseInt(e.target.value) || 15)} className={undefined}              />
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