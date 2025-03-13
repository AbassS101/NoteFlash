// src/app/(main)/notes/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useNoteStore } from '@/store/note-store';
import { FolderDialog } from '@/components/ui/folder-dialog';
import { FolderTree, TreeItem } from '@/components/ui/folder-tree';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  File, 
  Search, 
  Tag,
  MoreHorizontal,
  Edit,
  Copy,
  Trash
} from 'lucide-react';
import { Note, NoteFolder } from '@/types/flashcard-types';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function NotesPage() {
  const router = useRouter();
  const { ConfirmDialog, showConfirmDialog } = useConfirmDialog();
  
  const { 
    notes, folders,
    addNote, updateNote, deleteNote, duplicateNote,
    addFolder, updateFolder, deleteFolder, moveFolder, moveNoteToFolder
  } = useNoteStore();
  
  // Local state for UI controls
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<NoteFolder | undefined>(undefined);
  
  // Filter notes based on selected folder and search query
  const filteredNotes = notes.filter(note => {
    // Filter by folder
    const folderMatch = selectedFolderId === undefined 
      ? note.folderId === undefined 
      : note.folderId === selectedFolderId;
    
    // Filter by search query
    const searchMatch = searchQuery === '' || (
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return folderMatch && searchMatch;
  });
  
  // Transform folders to tree items
  const folderTreeItems: TreeItem[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: 'folder',
    color: folder.color,
    parentId: folder.parentId
  }));
  
  // Handle folder tree item click
  const handleFolderClick = (item: TreeItem) => {
    if (item.type === 'folder') {
      setSelectedFolderId(item.id);
    }
  };
  
  // Handle add new note
  const handleAddNote = () => {
    const newNote = addNote('Untitled Note', '', selectedFolderId);
    // Navigate to edit note page
    router.push(`/notes/${newNote.id}`);
  };
  
  // Handle note click to navigate to note detail/edit page
  const handleNoteClick = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };
  
  // Handle add new folder
  const handleAddFolder = (parentId?: string) => {
    setSelectedFolder(undefined);
    setIsAddFolderDialogOpen(true);
  };
  
  // Handle save new folder
  const handleSaveNewFolder = (data: { name: string; description?: string; parentId?: string; color?: string }) => {
    const newFolder = addFolder(data.name, data.parentId || selectedFolderId);
    if (data.description) {
      updateFolder(newFolder.id, { description: data.description });
    }
    if (data.color) {
      updateFolder(newFolder.id, { color: data.color });
    }
    setIsAddFolderDialogOpen(false);
  };
  
  // Handle edit folder
  const handleEditFolder = (item: TreeItem) => {
    const folder = folders.find(f => f.id === item.id);
    if (folder) {
      setSelectedFolder(folder);
      setIsEditFolderDialogOpen(true);
    }
  };
  
  // Handle save edited folder
  const handleSaveEditedFolder = (data: { name: string; description?: string; parentId?: string; color?: string }) => {
    if (selectedFolder) {
      updateFolder(selectedFolder.id, {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        color: data.color
      });
    }
    setIsEditFolderDialogOpen(false);
  };
  
  // Handle delete folder
  const handleDeleteFolder = (item: TreeItem) => {
    const folderToDelete = folders.find(f => f.id === item.id);
    if (folderToDelete) {
      showConfirmDialog({
        title: "Delete Folder",
        message: `Are you sure you want to delete "${folderToDelete.name}"? All notes inside will be moved to the parent folder. This action cannot be undone.`,
        confirmText: "Delete",
        confirmVariant: "destructive",
        onConfirm: () => {
          deleteFolder(item.id);
          if (selectedFolderId === item.id) {
            setSelectedFolderId(undefined);
          }
        }
      });
    }
  };
  
  // Handle delete note
  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (noteToDelete) {
      showConfirmDialog({
        title: "Delete Note",
        message: `Are you sure you want to delete "${noteToDelete.title}"? This action cannot be undone.`,
        confirmText: "Delete",
        confirmVariant: "destructive",
        onConfirm: () => {
          deleteNote(noteId);
        }
      });
    }
  };
  
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
  
  const renderNoteTags = (note: Note) => {
    if (!note.tags || note.tags.length === 0) return null;
    
    return (
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
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 border rounded-lg p-3">
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Notes</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8"
                onClick={() => setSelectedFolderId(undefined)}
              >
                Home
              </Button>
            </div>
            
            <FolderTree
              items={folderTreeItems}
              onItemClick={handleFolderClick}
              onItemEdit={handleEditFolder}
              onItemDelete={handleDeleteFolder}
              onFolderCreate={handleAddFolder}
              onItemCreate={handleAddNote}
              selectedItemId={selectedFolderId}
            />
          </ScrollArea>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {selectedFolderId 
                ? folders.find(f => f.id === selectedFolderId)?.name || "Notes" 
                : "All Notes"}
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleAddFolder} size="sm" className={undefined} variant={undefined}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button onClick={handleAddNote} variant="default" size="sm" className={undefined}>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                          placeholder="Search notes..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchQuery(e.target.value)} type={undefined}            />
          </div>
          
          {/* Notes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add new note card */}
            <Card className="cursor-pointer hover:shadow-md border-dashed h-full min-h-[200px]" onClick={handleAddNote}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-center">Add New Note</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Create a new note
                </p>
              </CardContent>
            </Card>
            
            {/* Note cards */}
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md flex flex-col">
                <CardContent className="p-4 flex-grow cursor-pointer" onClick={() => handleNoteClick(note)}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium line-clamp-1">{note.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={undefined}>
                        <DropdownMenuItem onClick={(e: { stopPropagation: () => void; }) => {
                                        e.stopPropagation();
                                        handleNoteClick(note);
                                    } } className={undefined} inset={undefined}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: { stopPropagation: () => void; }) => {
                                        e.stopPropagation();
                                        duplicateNote(note.id);
                                    } } className={undefined} inset={undefined}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                                        className="text-red-600 focus:text-red-600"
                                        onClick={(e: { stopPropagation: () => void; }) => {
                                            e.stopPropagation();
                                            handleDeleteNote(note.id);
                                        } } inset={undefined}                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getExcerpt(note.content)}
                  </p>
                  {renderNoteTags(note)}
                </CardContent>
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                  Updated {formatDate(note.updatedAt)}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <FolderDialog
        isOpen={isAddFolderDialogOpen}
        onClose={() => setIsAddFolderDialogOpen(false)}
        onSave={handleSaveNewFolder}
        folders={folders}
        dialogTitle="Create New Folder"
        type="note"
      />
      
      <FolderDialog
        isOpen={isEditFolderDialogOpen}
        onClose={() => setIsEditFolderDialogOpen(false)}
        onSave={handleSaveEditedFolder}
        folder={selectedFolder}
        folders={folders}
        dialogTitle="Edit Folder"
        type="note"
      />
      
      <ConfirmDialog />
    </div>
  );
}