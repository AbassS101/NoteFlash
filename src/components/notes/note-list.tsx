'use client';

// src/components/notes/note-list.tsx
import React, { useState, useMemo } from 'react';
import { useNoteStore } from '@/store/note-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash, Copy, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Note } from '@/types/flashcard-types';

interface NoteListProps {
  folderId?: string;
}

export const NoteList: React.FC<NoteListProps> = ({ folderId }) => {
  const router = useRouter();
  const { notes, setCurrentNote, createNote, deleteNote, duplicateNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes based on folderId and search query
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
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
  }, [notes, folderId, searchQuery]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get excerpt from note content
  const getExcerpt = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Handle creating a new note
  const handleCreateNote = () => {
    const newNote = createNote(folderId);
    router.push(`/notes/${newNote.id}`);
  };

  // Handle note click to edit
  const handleNoteClick = (note: Note) => {
    setCurrentNote(note);
    router.push(`/notes/${note.id}`);
  };

  // Handle note deletion
  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(noteId);
    }
  };

  // Handle note duplication
  const handleDuplicateNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNote(noteId);
  };

  return (
    <div className="space-y-4">
      {/* Search and create */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchQuery(e.target.value)} type={undefined}          />
        </div>
        <Button onClick={handleCreateNote} className={undefined} variant={undefined} size={undefined}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Note list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <Card 
            key={note.id} 
            className="cursor-pointer hover:shadow-md"
            onClick={() => handleNoteClick(note)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium line-clamp-1">{note.title}</h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e: React.MouseEvent<Element, MouseEvent>) => handleDuplicateNote(note.id, e)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={(e: React.MouseEvent<Element, MouseEvent>) => handleDeleteNote(note.id, e)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {getExcerpt(note.content)}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-2 text-xs text-muted-foreground border-t">
              Updated {formatDate(note.updatedAt)}
            </CardFooter>
          </Card>
        ))}
        
        {filteredNotes.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery ? 'No notes match your search' : 'No notes in this folder'}
          </div>
        )}
      </div>
    </div>
  );
};