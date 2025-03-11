// src/components/layout/search.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNoteStore } from '@/store/note-store';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import React from 'react';

export function Search() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { notes } = useNoteStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter notes based on search
  const filteredNotes = search.trim() === '' 
    ? [] 
    : notes.filter(note => 
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(note.content).toLowerCase().includes(search.toLowerCase())
      );

  // Handle keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (id: string) => {
    router.push(`/?id=${id}`);
    setOpen(false);
  };

  return (
    <>
      <Button
              variant="outline"
              className="relative h-9 w-9 p-0 lg:h-9 lg:w-60 lg:justify-start lg:px-3 lg:py-2"
              onClick={() => setOpen(true)} size={undefined}      >
        <SearchIcon className="h-4 w-4 lg:mr-2" />
        <span className="hidden lg:inline-flex">Search notes...</span>
        <span className="sr-only">Search notes</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
                  placeholder="Search notes..."
                  value={search}
                  onValueChange={setSearch}
                  ref={inputRef} className={undefined}        />
        <CommandList className={undefined}>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Notes" className={undefined}>
            {filteredNotes.map(note => (
              <CommandItem
                key={note.id}
                onSelect={() => handleSelect(note.id)}
                className="flex items-center justify-between"
              >
                <span>{note.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updated).toLocaleDateString()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}