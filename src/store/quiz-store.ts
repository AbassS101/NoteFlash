// src/store/quiz-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  created: Date;
  lastTaken: Date | null;
  timesCompleted: number;
  bestScore: number; // percentage
  tags: string[];
}

interface QuizAttempt {
  quizId: string;
  answers: (string | null)[];
  startTime: Date;
  endTime: Date | null;
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentAttempt: QuizAttempt | null;
  isLoading: boolean;
  error: string | null;
  
  createQuiz: (title: string, description: string, questions: QuizQuestion[], timeLimit?: number) => void;
  updateQuiz: (id: string, data: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  startQuiz: (quizId: string) => void;
  answerQuestion: (questionIndex: number, answer: string | null) => void;
  finishQuiz: () => { score: number; correctCount: number; incorrectCount: number; timeTaken: number };
  fetchQuizzes: () => Promise<void>;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      currentQuiz: null,
      currentAttempt: null,
      isLoading: false,
      error: null,
      
      createQuiz: (title, description, questions, timeLimit = 15) => {
        const newQuiz: Quiz = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title,
          description,
          questions,
          timeLimit,
          created: new Date(),
          lastTaken: null,
          timesCompleted: 0,
          bestScore: 0,
          tags: [],
        };
        
        set(state => ({ 
          quizzes: [...state.quizzes, newQuiz]
        }));
      },
      
      updateQuiz: (id, data) => {
        set(state => ({
          quizzes: state.quizzes.map(quiz => 
            quiz.id === id ? { ...quiz, ...data } : quiz
          ),
          currentQuiz: state.currentQuiz?.id === id 
            ? { ...state.currentQuiz, ...data }
            : state.currentQuiz
        }));
      },
      
      deleteQuiz: (id) => {
        set(state => ({
          quizzes: state.quizzes.filter(quiz => quiz.id !== id),
          currentQuiz: state.currentQuiz?.id === id ? null : state.currentQuiz,
          currentAttempt: state.currentAttempt?.quizId === id ? null : state.currentAttempt
        }));
      },
      
      startQuiz: (quizId) => {
        const quiz = get().quizzes.find(q => q.id === quizId);
        if (!quiz) return;
        
        // Shuffle questions if the user has that setting enabled
        // For now, we'll just use the questions as they are
        const attempt: QuizAttempt = {
          quizId,
          answers: Array(quiz.questions.length).fill(null),
          startTime: new Date(),
          endTime: null
        };
        
        set({ currentQuiz: quiz, currentAttempt: attempt });
      },
      
      answerQuestion: (questionIndex, answer) => {
        const { currentAttempt } = get();
        if (!currentAttempt) return;
        
        const newAnswers = [...currentAttempt.answers];
        newAnswers[questionIndex] = answer;
        
        set({ 
          currentAttempt: { 
            ...currentAttempt, 
            answers: newAnswers 
          } 
        });
      },
      
      finishQuiz: () => {
        const { currentQuiz, currentAttempt } = get();
        if (!currentQuiz || !currentAttempt) {
          return { score: 0, correctCount: 0, incorrectCount: 0, timeTaken: 0 };
        }
        
        // Calculate score
        let correctCount = 0;
        currentQuiz.questions.forEach((question, i) => {
          if (currentAttempt.answers[i] === question.correctAnswer) {
            correctCount++;
          }
        });
        
        const incorrectCount = currentQuiz.questions.length - correctCount;
        const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
        
        // Calculate time taken
        const endTime = new Date();
        const timeTaken = Math.round(
          (endTime.getTime() - new Date(currentAttempt.startTime).getTime()) / 1000
        ); // in seconds
        
        // Update quiz stats
        const updatedQuiz = {
          ...currentQuiz,
          lastTaken: endTime,
          timesCompleted: currentQuiz.timesCompleted + 1,
          bestScore: Math.max(currentQuiz.bestScore, score)
        };
        
        set(state => ({
          quizzes: state.quizzes.map(quiz => 
            quiz.id === currentQuiz.id ? updatedQuiz : quiz
          ),
          currentQuiz: updatedQuiz,
          currentAttempt: {
            ...currentAttempt,
            endTime
          }
        }));
        
        return {
          score,
          correctCount,
          incorrectCount,
          timeTaken
        };
      },
      
      fetchQuizzes: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          // For now, we'll rely on the persisted state
          // const response = await fetch('/api/quizzes');
          // const quizzes = await response.json();
          // set({ quizzes, isLoading: false });
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch quizzes', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'noteflash-quizzes',
      partialize: (state) => ({ 
        quizzes: state.quizzes,
      }),
    }
  )
);