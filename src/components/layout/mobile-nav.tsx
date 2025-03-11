// src/components/layout/mobile-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, FileText, CreditCard, GraduationCap, HelpCircle, Settings, CreditCard as PricingIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import React from 'react';

const navItems = [
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex flex-col h-full">
          <div className="border-b p-4">
            <div className="flex items-center">
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
              <span className="ml-2 font-bold">NoteFlash</span>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md text-sm transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}