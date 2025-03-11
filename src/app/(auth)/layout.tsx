// src/app/(auth)/layout.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/utils/auth';
import React from 'react';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  // If user is authenticated, redirect to the main page
  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-between p-10 bg-muted/40 hidden lg:flex">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <Link href="/" className="font-bold">NoteFlash</Link>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Smart Note-Taking & Flashcards</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The ultimate app for effective study with integrated flashcards 
            and spaced repetition to supercharge your learning.
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NoteFlash. All rights reserved.
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
