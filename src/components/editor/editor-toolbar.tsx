// src/components/editor/editor-toolbar.tsx
'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
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
  Link as LinkIcon, 
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface TagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTags: string[];
  onSave: (tags: string[]) => void;
}

const TagDialog: React.FC<TagDialogProps> = ({ isOpen, onClose, currentTags, onSave }) => {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState('');

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
    <Dialog open={isOpen} onOpenChange={(open: any) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Manage Tags</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e: { key: string; preventDefault: () => void; }) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              } }
              className="flex-grow" type={undefined}            />
            <Button onClick={handleAddTag} className={undefined} variant={undefined} size={undefined}>Add</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive focus:outline-none"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">No tags added yet</span>
            )}
          </div>
        </div>
        
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={onClose} className={undefined} size={undefined}>Cancel</Button>
          <Button onClick={handleSave} className={undefined} variant={undefined} size={undefined}>Save Tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Interface for the toolbar props
export interface EditorToolbarProps {
  editor: Editor | null;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editor, 
  isSaving, 
  onSave 
}) => {
  const router = useRouter();
  const { currentNote, setCurrentNote } = useNoteStore();
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const handleBack = () => {
    onSave().then(() => router.push('/notes'));
  };

  const handleTagsUpdate = (newTags: string[]) => {
    if (currentNote) {
      setCurrentNote({
        ...currentNote,
        tags: newTags
      });
    }
  };

  // Function to handle formatting buttons
  const handleFormat = (format: string, param?: string) => {
    if (!editor) return;

    // Use type assertion to bypass TypeScript checks
    const editorCommands = editor.chain().focus() as any;

    switch (format) {
      case 'bold':
        editorCommands.toggleBold().run();
        break;
      case 'italic':
        editorCommands.toggleItalic().run();
        break;
      case 'underline':
        editorCommands.toggleUnderline().run();
        break;
      case 'bullet':
        editorCommands.toggleBulletList().run();
        break;
      case 'number':
        editorCommands.toggleOrderedList().run();
        break;
      case 'h1':
        editorCommands.toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editorCommands.toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editorCommands.toggleHeading({ level: 3 }).run();
        break;
      case 'link':
        if (param) {
          // Correctly set link using Tiptap's link extension
          editorCommands.extendMarkRange('link').setLink({ href: param }).run();
        } else {
          // Unset link if no URL is provided
          editorCommands.unsetLink().run();
        }
        break;
      case 'image':
        if (param) {
          editorCommands.setImage({ src: param, alt: 'Image' }).run();
        }
        break;
      case 'code':
        editorCommands.toggleCodeBlock().run();
        break;
      default:
        break;
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
            value={currentNote?.title || ''}
            onChange={(e: { target: { value: any; }; }) => {
              if (currentNote) {
                setCurrentNote({ ...currentNote, title: e.target.value });
              }
            } }
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
          <Button
            onClick={() => onSave()}
            size="sm"
            disabled={isSaving} className={undefined} variant={undefined}          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('bold')}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          data-active={editor?.isActive('bold')}
          className="data-[active=true]:bg-muted"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('italic')}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          data-active={editor?.isActive('italic')}
          className="data-[active=true]:bg-muted"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('underline')}
          disabled={!editor?.can().chain().focus().toggleUnderline().run()}
          data-active={editor?.isActive('underline')}
          className="data-[active=true]:bg-muted"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('bullet')}
          disabled={!editor?.can().chain().focus().toggleBulletList().run()}
          data-active={editor?.isActive('bulletList')}
          className="data-[active=true]:bg-muted"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('number')}
          disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
          data-active={editor?.isActive('orderedList')}
          className="data-[active=true]:bg-muted"
        >
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
            <DropdownMenuItem 
              onClick={() => handleFormat('h1')}
              data-active={editor?.isActive('heading', { level: 1 })}
              className="data-[active=true]:bg-muted" inset={undefined}            >
              <Heading1 className="h-4 w-4 mr-2" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFormat('h2')}
              data-active={editor?.isActive('heading', { level: 2 })}
              className="data-[active=true]:bg-muted" inset={undefined}            >
              <Heading2 className="h-4 w-4 mr-2" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFormat('h3')}
              data-active={editor?.isActive('heading', { level: 3 })}
              className="data-[active=true]:bg-muted" inset={undefined}            >
              <Heading3 className="h-4 w-4 mr-2" /> Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) handleFormat('link', url);
          }}
          data-active={editor?.isActive('link')}
          className="data-[active=true]:bg-muted"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) handleFormat('image', url);
          } } className={undefined}        >
          <Image className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleFormat('code')}
          disabled={!editor?.can().chain().focus().toggleCodeBlock().run()}
          data-active={editor?.isActive('codeBlock')}
          className="data-[active=true]:bg-muted"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tag Dialog */}
      <TagDialog
        isOpen={isTagDialogOpen}
        onClose={() => setIsTagDialogOpen(false)}
        currentTags={currentNote?.tags || []}
        onSave={handleTagsUpdate}
      />
    </div>
  );
};