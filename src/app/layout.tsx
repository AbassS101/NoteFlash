import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils/utils';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import '@/app/globals.css';
import React from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'NoteFlash - Smart Notes & Flashcards',
  description: 'Take notes and create flashcards with spaced repetition for effective learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      
        
          
            {children}
            
          
        
      
    
  );
}