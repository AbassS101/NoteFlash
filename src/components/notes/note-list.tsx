// src/components/notes/note-list.tsx
'use client';

import { useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  FileText, 
  Trash2, 
  Edit, 
  Copy, 
  FileDown 
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import React from 'react';

export function NoteList() {
  const { notes, currentNote, setCurrentNote, createNote, updateNote, deleteNote, fetchNotes } = useNoteStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotes, setFilteredNotes] = useState(notes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  // Initialize notes and handle note selection from URL
  useEffect(() => {
    fetchNotes();
    
    // Check for note ID in URL
    const noteId = searchParams.get('id');
    if (noteId) {
      setCurrentNote(noteId);
    }
  }, [fetchNotes, setCurrentNote, searchParams]);

  // Filter notes when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredNotes(
        notes.filter(note => {
          // Safe content check
          const contentString = typeof note.content === 'string' 
            ? note.content 
            : note.content && typeof note.content === 'object'
              ? JSON.stringify(note.content)
              : '';
  
          return note.title.toLowerCase().includes(term) || 
                 contentString.toLowerCase().includes(term);
        })
      );
    }
  }, [searchTerm, notes]);

  // Handle creating a new note
  const handleOpenCreateDialog = () => {
    setNewNoteName('Untitled Note');
    setIsCreateDialogOpen(true);
  };

  const handleCreateNote = () => {
    if (newNoteName.trim() === '') {
      toast({
        title: "Error",
        description: "Note name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    createNote(newNoteName.trim(), { type: 'doc', content: [{ type: 'paragraph' }] });
    
    toast({
      title: 'Note created',
      description: 'New note has been created successfully.',
    });
    
    setIsCreateDialogOpen(false);
    setNewNoteName('');
  };

  // Handle renaming a note
  const handleOpenRenameDialog = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const note = notes.find(note => note.id === id);
    if (note) {
      setNewNoteName(note.title);
      setSelectedNoteId(id);
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameNote = () => {
    if (!selectedNoteId || newNoteName.trim() === '') {
      toast({
        title: "Error",
        description: "Note name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    updateNote(selectedNoteId, { title: newNoteName.trim() });
    
    toast({
      title: 'Note renamed',
      description: 'Note has been renamed successfully.',
    });
    
    setIsRenameDialogOpen(false);
    setNewNoteName('');
    setSelectedNoteId(null);
  };

  // Handle duplicating a note
  const handleDuplicateNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const note = notes.find(note => note.id === id);
    if (note) {
      const { title, content } = note;
      const newTitle = `Copy of ${title}`;
      
      createNote(newTitle, content);
      
      toast({
        title: "Note duplicated",
        description: "A copy of your note has been created.",
      });
    }
  };

  // Handle exporting a note
  const handleExportNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const note = notes.find(note => note.id === id);
    if (note) {
      try {
        const { title, content } = note;
        const contentString = JSON.stringify(content, null, 2);
        
        // Create a blob and download it
        const blob = new Blob([contentString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Note exported",
          description: "Your note has been exported as a JSON file.",
        });
      } catch (error) {
        toast({
          title: "Error exporting note",
          description: "Failed to export your note.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete note',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
    });

    if (confirmed) {
      deleteNote(id);
      toast({
        title: 'Note deleted',
        description: 'The note has been deleted successfully.',
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    
    // If today, show time
    if (noteDate.toDateString() === now.toDateString()) {
      return noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (noteDate.getFullYear() === now.getFullYear()) {
      return noteDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return noteDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-64 border-r bg-muted/40 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          onClick={handleOpenCreateDialog}
          className="w-full justify-start"
          variant="default"
          size="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>
      
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchTerm(e.target.value)}
            type="text"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          <div className="py-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "group flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted",
                  currentNote?.id === note.id && "bg-muted"
                )}
                onClick={() => setCurrentNote(note.id)}
              >
                <div className="truncate flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{note.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span>
                      {formatDate(note.updated)}
                    </span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={undefined}>
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) => handleOpenRenameDialog(note.id, e)} className={undefined} inset={undefined}                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) => handleDuplicateNote(note.id, e)} className={undefined} inset={undefined}                    >
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Duplicate</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) => handleExportNote(note.id, e)} className={undefined} inset={undefined}                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      <span>Export</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={undefined} />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e: React.MouseEvent<Element, MouseEvent> | undefined) => handleDeleteNote(note.id, e)} inset={undefined}                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
        
        {notes.length === 0 && !searchTerm && (
          <div className="flex flex-col items-center justify-center p-4 mt-8">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first note to get started.
            </p>
            <Button onClick={handleOpenCreateDialog} size="sm" className={undefined} variant={undefined}>
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className={undefined}>
            <DialogTitle className={undefined}>Create New Note</DialogTitle>
            <DialogDescription className={undefined}>
              Enter a name for your new note
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note-name" className={undefined}>Note Name</Label>
              <Input
                id="note-name"
                value={newNoteName}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNewNoteName(e.target.value)}
                placeholder="Enter note name"
                autoFocus
                type="text" className={undefined}              />
            </div>
          </div>
          <DialogFooter className={undefined}>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className={undefined} size={undefined}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote} className={undefined} variant={undefined} size={undefined}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Note Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className={undefined}>
            <DialogTitle className={undefined}>Rename Note</DialogTitle>
            <DialogDescription className={undefined}>
              Enter a new name for your note
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-note" className={undefined}>Note Name</Label>
              <Input
                id="rename-note"
                value={newNoteName}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNewNoteName(e.target.value)}
                placeholder="Enter new note name"
                autoFocus
                type="text" className={undefined}              />
            </div>
          </div>
          <DialogFooter className={undefined}>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} className={undefined} size={undefined}>
              Cancel
            </Button>
            <Button onClick={handleRenameNote} className={undefined} variant={undefined} size={undefined}>
              Rename Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}