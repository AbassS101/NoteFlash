// src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import {
  FileText,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Settings,
  CreditCard as PricingIcon,
  ChevronLeft,
} from 'lucide-react';
import React from 'react';

const sidebarItems = [
  {
    title: 'Notes',
    href: '/',
    icon: FileText,
  },
  {
    title: 'Flashcards',
    href: '/flashcards',
    icon: CreditCard,
  },
  {
    title: 'Review',
    href: '/review',
    icon: GraduationCap,
  },
  {
    title: 'Quizzes',
    href: '/quizzes',
    icon: HelpCircle,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Pricing',
    href: '/pricing',
    icon: PricingIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'border-r bg-muted/40 h-screen transition-all duration-300 hidden md:block relative',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center h-14 px-4 border-b">
        <div className={cn('flex items-center', collapsed ? 'justify-center w-full' : '')}>
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
          {!collapsed && <span className="ml-2 font-bold">NoteFlash</span>}
        </div>
      </div>
      
      <div className="py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed ? 'justify-center' : ''
              )}
            >
              <item.icon className={cn('h-5 w-5', collapsed ? '' : 'mr-2')} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-4 right-2 h-7 w-7"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
      </Button>
    </div>
  );
}
