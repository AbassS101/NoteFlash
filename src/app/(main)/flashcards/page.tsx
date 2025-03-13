// src/app/(main)/flashcards/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '@/store/flashcard-store';
import { DeckGrid } from '@/components/flashcards/deck-grid';
import { DeckDialog } from '@/components/flashcards/deck-dialog';
import { FolderDialog } from '@/components/ui/folder-dialog';
import { FolderTree, TreeItem } from '@/components/ui/folder-tree';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';
import { FlashcardDeck, FlashcardFolder } from '@/types/flashcard-types';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FlashcardsPage() {
  const router = useRouter();
  const { ConfirmDialog, showConfirmDialog } = useConfirmDialog();
  
  const { 
    decks, folders,
    addDeck, updateDeck, deleteDeck, duplicateDeck,
    addFolder, updateFolder, deleteFolder, moveFolder, moveDeckToFolder
  } = useFlashcardStore();
  
  // Local state for UI controls
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [isAddDeckDialogOpen, setIsAddDeckDialogOpen] = useState(false);
  const [isEditDeckDialogOpen, setIsEditDeckDialogOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | undefined>(undefined);
  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FlashcardFolder | undefined>(undefined);
  
  // Filter decks based on selected folder
  const filteredDecks = decks.filter(deck => {
    // If no folder is selected, show only decks without a folder
    if (selectedFolderId === undefined) {
      return deck.folderId === undefined;
    }
    // Otherwise, show decks in the selected folder
    return deck.folderId === selectedFolderId;
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
  
  // Handle adding a new deck
  const handleAddDeck = () => {
    setSelectedDeck(undefined);
    setIsAddDeckDialogOpen(true);
  };
  
  // Handle save new deck
  const handleSaveNewDeck = (data: { name: string; description: string; folderId?: string }) => {
    addDeck(data.name, data.description, data.folderId || selectedFolderId);
    setIsAddDeckDialogOpen(false);
  };
  
  // Handle edit deck
  const handleEditDeck = (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    setIsEditDeckDialogOpen(true);
  };
  
  // Handle save edited deck
  const handleSaveEditedDeck = (data: { name: string; description: string; folderId?: string }) => {
    if (selectedDeck) {
      updateDeck(selectedDeck.id, {
        name: data.name,
        description: data.description,
        folderId: data.folderId
      });
    }
    setIsEditDeckDialogOpen(false);
  };
  
  // Handle delete deck
  const handleDeleteDeck = (deckId: string) => {
    const deckToDelete = decks.find(d => d.id === deckId);
    if (deckToDelete) {
      showConfirmDialog({
        title: "Delete Deck",
        message: `Are you sure you want to delete "${deckToDelete.name}"? This will delete all flashcards in this deck. This action cannot be undone.`,
        confirmText: "Delete",
        confirmVariant: "destructive",
        onConfirm: () => {
          deleteDeck(deckId);
        }
      });
    }
  };
  
  // Handle deck click to navigate to deck detail/edit page
  const handleDeckClick = (deck: FlashcardDeck) => {
    // Navigate to deck detail page (TBD)
    console.log("Navigate to deck detail page", deck.id);
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
        message: `Are you sure you want to delete "${folderToDelete.name}"? All content inside will be moved to the parent folder. This action cannot be undone.`,
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
  
  // Handle study deck
  const handleStudyDeck = (deckId: string) => {
    router.push(`/review?deckId=${deckId}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 border rounded-lg p-3">
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Flashcards</h2>
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
              selectedItemId={selectedFolderId}
            />
          </ScrollArea>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {selectedFolderId 
                ? folders.find(f => f.id === selectedFolderId)?.name || "Flashcards" 
                : "All Flashcards"}
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleAddFolder} size="sm" className={undefined} variant={undefined}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button onClick={handleAddDeck} variant="default" size="sm" className={undefined}>
                <Plus className="h-4 w-4 mr-2" />
                New Deck
              </Button>
            </div>
          </div>
          
          <DeckGrid
            decks={filteredDecks}
            onDeckClick={handleDeckClick}
            onAddDeck={handleAddDeck}
            onEditDeck={handleEditDeck}
            onDeleteDeck={handleDeleteDeck}
            onDuplicateDeck={duplicateDeck}
            onStudyDeck={handleStudyDeck}
          />
        </div>
      </div>
      
      {/* Dialogs */}
      <DeckDialog
        isOpen={isAddDeckDialogOpen}
        onClose={() => setIsAddDeckDialogOpen(false)}
        onSave={handleSaveNewDeck}
        folders={folders}
        dialogTitle="Create New Deck"
      />
      
      <DeckDialog
        isOpen={isEditDeckDialogOpen}
        onClose={() => setIsEditDeckDialogOpen(false)}
        onSave={handleSaveEditedDeck}
        deck={selectedDeck}
        folders={folders}
        dialogTitle="Edit Deck"
      />
      
      <FolderDialog
        isOpen={isAddFolderDialogOpen}
        onClose={() => setIsAddFolderDialogOpen(false)}
        onSave={handleSaveNewFolder}
        folders={folders}
        dialogTitle="Create New Folder"
        type="flashcard"
      />
      
      <FolderDialog
        isOpen={isEditFolderDialogOpen}
        onClose={() => setIsEditFolderDialogOpen(false)}
        onSave={handleSaveEditedFolder}
        folder={selectedFolder}
        folders={folders}
        dialogTitle="Edit Folder"
        type="flashcard"
      />
      
      <ConfirmDialog />
    </div>
  );
}