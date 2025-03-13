// src/components/editor/editor-toolbar.tsx
import React, { useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Link, 
  Image, 
  Code, 
  Save, 
  ArrowLeft,
  Tag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTags: string[];
  onSave: (tags: string[]) => void;
}

const TagDialog: React.FC<TagDialogProps> = ({ isOpen, onClose, currentTags, onSave }) => {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Manage Tags</h2>
        
        <div className="flex gap-2 mb-4">
          <Input
            value={newTag}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyPress={(e: { key: string; }) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            } } className={undefined} type={undefined}          />
          <Button onClick={handleAddTag} className={undefined} variant={undefined} size={undefined}>Add</Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-gray-500">No tags added yet</span>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className={undefined} size={undefined}>Cancel</Button>
          <Button onClick={handleSave} className={undefined} variant={undefined} size={undefined}>Save Tags</Button>
        </div>
      </div>
    </div>
  );
};

interface EditorToolbarProps {
  onFormatClick: (format: string, param?: string) => void;
  noteTitle: string;
  onTitleChange: (title: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  onFormatClick, 
  noteTitle, 
  onTitleChange 
}) => {
  const router = useRouter();
  const { currentNote, setCurrentNote, saveCurrentNote } = useNoteStore();
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const handleBack = () => {
    saveCurrentNote();
    router.push('/notes');
  };

  const handleSave = () => {
    saveCurrentNote();
  };

  const handleTagsUpdate = (newTags: string[]) => {
    if (currentNote) {
      const updatedNote = { ...currentNote, tags: newTags };
      setCurrentNote(updatedNote);
    }
  };

  return (
    <div className="border-b p-2 sticky top-0 bg-background z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack} className={undefined}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={noteTitle}
            onChange={(e: { target: { value: string; }; }) => onTitleChange(e.target.value)}
            className="max-w-md border-none focus-visible:ring-0 text-lg font-medium"
            placeholder="Untitled Note" type={undefined}          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsTagDialogOpen(true)} className={undefined}          >
            <Tag className="h-4 w-4 mr-2" />
            Tags {currentNote?.tags && currentNote.tags.length > 0 && `(${currentNote.tags.length})`}
          </Button>
          <Button onClick={handleSave} size="sm" className={undefined} variant={undefined}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('bold')} className={undefined}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('italic')} className={undefined}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('underline')} className={undefined}>
          <Underline className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('bullet')} className={undefined}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('number')} className={undefined}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={undefined}>
              <Heading1 className="h-4 w-4 mr-1" /> Heading
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={undefined}>
            <DropdownMenuItem onClick={() => onFormatClick('h1')} className={undefined} inset={undefined}>
              <Heading1 className="h-4 w-4 mr-2" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFormatClick('h2')} className={undefined} inset={undefined}>
              <Heading2 className="h-4 w-4 mr-2" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFormatClick('h3')} className={undefined} inset={undefined}>
              <Heading3 className="h-4 w-4 mr-2" /> Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={() => {
          const url = prompt('Enter link URL:');
          if (url) onFormatClick('link', url);
        } } className={undefined}>
          <Link className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={() => {
          const url = prompt('Enter image URL:');
          if (url) onFormatClick('image', url);
        } } className={undefined}>
          <Image className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={() => onFormatClick('code')} className={undefined}>
          <Code className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tag Dialog */}
      {isTagDialogOpen && (
        <TagDialog
          isOpen={isTagDialogOpen}
          onClose={() => setIsTagDialogOpen(false)}
          currentTags={currentNote?.tags || []}
          onSave={handleTagsUpdate}
        />
      )}
    </div>
  );
};