// src/components/notes/note-list.tsx
'use client'; // Mark as a client component

import React, { useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash, Copy, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { Note } from '@/types/flashcard-types';

interface NoteListProps {
  folderId?: string;
}

export function NoteList({ folderId }: NoteListProps) {
  const { notes, createNote, deleteNote, duplicateNote, setCurrentNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Filter notes based on folderId and search query
  const filteredNotes = notes.filter(note => {
    // Filter by folder
    const folderMatch = folderId === undefined 
      ? note.folderId === undefined 
      : note.folderId === folderId;
    
    // Filter by search query
    const searchMatch = searchQuery === '' || (
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return folderMatch && searchMatch;
  });

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get excerpt from note content
  const getExcerpt = (content: string, maxLength = 80) => {
    // Remove HTML tags for plain text excerpt
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // Handle creating a new note
  const handleCreateNote = () => {
    const newNote = createNote(folderId);
    setCurrentNote(newNote);
  };

  // Handle note click to edit
  const handleNoteClick = (note: Note) => {
    setCurrentNote(note);
  };

  // Handle note deletion
  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    showConfirmDialog({
      title: "Delete Note",
      message: "Are you sure you want to delete this note? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: () => deleteNote(noteId)
    });
  };

  // Handle note duplication
  const handleDuplicateNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicatedNote = duplicateNote(noteId);
    setCurrentNote(duplicatedNote);
  };

  return (
    <div className="w-80 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              value={searchQuery}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchQuery(e.target.value)} type={undefined}            />
          </div>
          <Button size="icon" onClick={handleCreateNote} className={undefined} variant={undefined}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'No matching notes found' : 'No notes yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer p-3 hover:bg-muted transition-colors"
                  onClick={() => handleNoteClick(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium line-clamp-1">{note.title || 'Untitled'}</h3>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e: React.MouseEvent<Element, MouseEvent>) => handleDuplicateNote(note.id, e)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e: React.MouseEvent<Element, MouseEvent>) => handleDeleteNote(note.id, e)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {getExcerpt(note.content)}
                  </p>
                  
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <div className="text-muted-foreground">
                      {formatDate(note.updatedAt)}
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-1">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      <ConfirmDialog />
    </div>
  );
}