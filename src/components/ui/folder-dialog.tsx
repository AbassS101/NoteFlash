// src/components/ui/folder-dialog.tsx
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
import { ColorSwatch } from '@/components/ui/color-swatch';

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
}

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; parentId?: string; color?: string }) => void;
  folder?: Folder;
  folders?: Folder[];
  dialogTitle: string;
  type: 'flashcard' | 'note';
}

// Define a color palette
const colorPalette = [
  '#e9e9e9', // Default light gray
  '#f87171', // Red
  '#fb923c', // Orange
  '#fbbf24', // Amber
  '#a3e635', // Lime
  '#4ade80', // Green
  '#2dd4bf', // Teal
  '#38bdf8', // Sky
  '#818cf8', // Indigo
  '#c084fc', // Purple
  '#f472b6', // Pink
];

export const FolderDialog: React.FC<FolderDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  folder,
  folders,
  dialogTitle,
  type
}) => {
  const [name, setName] = useState(folder?.name || '');
  const [description, setDescription] = useState(folder?.description || '');
  const [parentId, setParentId] = useState<string | undefined>(folder?.parentId);
  const [color, setColor] = useState(folder?.color || colorPalette[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, parentId, color });
    resetForm();
  };

  const resetForm = () => {
    setName(folder?.name || '');
    setDescription(folder?.description || '');
    setParentId(folder?.parentId);
    setColor(folder?.color || colorPalette[0]);
  };

  // Filter out current folder and its children to prevent circular references
  const getAvailableFolders = (allFolders: Folder[] = [], currentId?: string): Folder[] => {
    if (!currentId) return allFolders;
    
    // Get all descendant IDs to exclude
    const getDescendantIds = (folderId: string, result: Set<string> = new Set()): Set<string> => {
      result.add(folderId);
      allFolders
        .filter(f => f.parentId === folderId)
        .forEach(child => getDescendantIds(child.id, result));
      return result;
    };
    
    const excludeIds = getDescendantIds(currentId);
    return allFolders.filter(f => !excludeIds.has(f.id));
  };

  // Build folder hierarchy for select
  const buildFolderOptions = (
    allFolders: Folder[] = [], 
    parentId?: string, 
    level = 0
  ): React.ReactNode[] => {
    return allFolders
      .filter(f => f.parentId === parentId)
      .flatMap(f => [
        <option key={f.id} value={f.id}>
          {"\u00A0".repeat(level * 2)}{level > 0 ? "└ " : ""}{f.name}
        </option>,
        ...buildFolderOptions(allFolders, f.id, level + 1)
      ]);
  };

  const availableFolders = folders ? getAvailableFolders(folders, folder?.id) : [];

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
              <Label htmlFor="description" className={undefined}>Description (Optional)</Label>
              <Textarea
                              id="description"
                              value={description}
                              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setDescription(e.target.value)}
                              rows={2} className={undefined}              />
            </div>
            <div className="grid gap-2">
              <Label className={undefined}>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((c) => (
                <button
                key={c}
                type="button"
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                onClick={() => setColor(c)}
                data-color={c}
                title={`Select color ${c}`}
                aria-label={`Select color ${c}`}
              />
              
                ))}
              </div>
            </div>
            {availableFolders.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parentFolder" className={undefined}>Parent Folder (Optional)</Label>
                <select
                  id="parentFolder"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || undefined)}
                >
                  <option value="">No Parent Folder</option>
                  {buildFolderOptions(availableFolders)}
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