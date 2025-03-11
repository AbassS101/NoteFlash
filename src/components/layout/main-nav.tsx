// src/components/layout/main-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/utils';
import React from 'react';

const navItems = [
  { 
    title: 'Notes', 
    href: '/' 
  },
  { 
    title: 'Flashcards', 
    href: '/flashcards' 
  },
  { 
    title: 'Review', 
    href: '/review' 
  },
  { 
    title: 'Quizzes', 
    href: '/quizzes' 
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6 text-sm ml-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "transition-colors hover:text-foreground",
            pathname === item.href ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}