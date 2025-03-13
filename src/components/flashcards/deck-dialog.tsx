// src/components/flashcards/deck-dialog.tsx
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FlashcardDeck, FlashcardFolder } from '@/types/flashcard-types';

interface DeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; folderId?: string }) => void;
  deck?: FlashcardDeck;
  folders?: FlashcardFolder[];
  dialogTitle: string;
}

export const DeckDialog: React.FC<DeckDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  deck,
  folders,
  dialogTitle
}) => {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [folderId, setFolderId] = useState<string | undefined>(deck?.folderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, folderId });
    resetForm();
  };

  const resetForm = () => {
    setName(deck?.name || '');
    setDescription(deck?.description || '');
    setFolderId(deck?.folderId);
  };

  // Build folder hierarchy for select
  const buildFolderOptions = (
    folders: FlashcardFolder[] = [], 
    parentId?: string, 
    level = 0
  ): React.ReactNode[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .flatMap(folder => [
        <option key={folder.id} value={folder.id}>
          {"\u00A0".repeat(level * 2)}{level > 0 ? "└ " : ""}{folder.name}
        </option>,
        ...buildFolderOptions(folders, folder.id, level + 1)
      ]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: any) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className={undefined}>
            <DialogTitle className={undefined}>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className={undefined}>Name</Label>
              <Input
                              id="name"
                              value={name}
                              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setName(e.target.value)}
                              required className={undefined} type={undefined}              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className={undefined}>Description</Label>
              <Textarea
                              id="description"
                              value={description}
                              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setDescription(e.target.value)}
                              rows={3} className={undefined}              />
            </div>
            {folders && folders.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="folder" className={undefined}>Folder</Label>
                <select
                  id="folder"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || undefined)}
                >
                  <option value="">No Folder</option>
                  {buildFolderOptions(folders)}
                </select>
              </div>
            )}
          </div>
          <DialogFooter className={undefined}>
            <Button type="button" variant="outline" onClick={onClose} className={undefined} size={undefined}>
              Cancel
            </Button>
            <Button type="submit" className={undefined} variant={undefined} size={undefined}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};