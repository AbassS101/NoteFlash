// src/components/editor/editor-toolbar.tsx
'use client';

import { type Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Quote, Code, Undo, Redo, Save, 
  Copy, FileDown, Trash2, MoreHorizontal, CreditCard
} from 'lucide-react';
import { useNoteStore } from '@/store/note-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useFlashcardStore } from '@/store/flashcard-store';
import { useQuizStore } from '@/store/quiz-store';
import { useConfirm } from '@/components/ui/confirm-dialog';
import React from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

// Create a simple styled button with title attribute for tooltips
function ToolbarButton({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  title, 
  children 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  title: string; 
  children: React.ReactNode 
}) {
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={onClick}
      className={isActive ? 'bg-muted' : undefined}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

// Heading dropdown component
function HeadingDropdown({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={editor.isActive('heading') ? 'bg-muted' : undefined}
          title="Heading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M6 12h12"></path>
            <path d="M6 4v16"></path>
            <path d="M18 4v16"></path>
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={undefined}>
        <DropdownMenuItem 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : undefined} inset={undefined}        >
          <span className="text-xl font-bold">Heading 1</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : undefined} inset={undefined}        >
          <span className="text-lg font-bold">Heading 2</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : undefined} inset={undefined}        >
          <span className="text-base font-bold">Heading 3</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EditorToolbar({ editor, isSaving, onSave }: EditorToolbarProps) {
  const { currentNote, deleteNote, createNote } = useNoteStore();
  const { addFlashcard } = useFlashcardStore();
  const { createQuiz } = useQuizStore();
  const { toast } = useToast();
// Get the confirm function from the hook
  const confirm = useConfirm();
  if (!editor || !currentNote) return null;

  const handleSave = async () => {
    try {
      await onSave();
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving note",
        description: "There was an error saving your note.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete note",
      description: "Are you sure you want to delete this note? This action cannot be undone.",
    });

    if (confirmed) {
      deleteNote(currentNote.id);
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    }
  };

  const handleDuplicate = () => {
    // Copy the current note's content to a new note
    const { title, content } = currentNote;
    const newTitle = `Copy of ${title}`;
    
    try {
      createNote(newTitle, content);
      
      toast({
        title: "Note duplicated",
        description: "A copy of your note has been created.",
      });
    } catch (error) {
      toast({
        title: "Error duplicating note",
        description: "Failed to create a duplicate note.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    try {
      const { title, content } = currentNote;
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
  };

  const generateFlashcards = () => {
    // Simple flashcard extraction logic
    // Look for lines with :: delimiter (Question :: Answer)
    const content = editor.getText();
    const lines = content.split('\n');
    
    let newCount = 0;
    lines.forEach(line => {
      if (line.includes('::')) {
        const parts = line.split('::').map(part => part.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          addFlashcard(parts[0], parts[1], currentNote.title);
          newCount++;
        }
      }
    });
    
    if (newCount > 0) {
      toast({
        title: "Flashcards created",
        description: `${newCount} flashcards have been created from your note.`,
      });
    } else {
      toast({
        title: "No flashcards found",
        description: "No flashcard patterns found. Use 'Question :: Answer' format to create flashcards.",
      });
    }
  };

  const generateQuiz = () => {
    // Simple quiz extraction for now
    // In a real app this would be more sophisticated
    toast({
      title: "Quiz generation",
      description: "Quiz generation will be implemented in a future update.",
    });
  };

  // Force an explicit focus to ensure commands work properly
  const ensureFocus = (callback: () => void) => {
    editor.commands.focus();
    callback();
  };

  return (
    <div className="border-b flex items-center p-2 gap-1 flex-wrap bg-muted/30">
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().undo().run())}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().redo().run())}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleBold().run())}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleItalic().run())}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleMark('underline').run())}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleStrike().run())}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <div className="flex items-center gap-1">
        <HeadingDropdown editor={editor} />
        
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleBulletList().run())}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleOrderedList().run())}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleBlockquote().run())}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => ensureFocus(() => editor.chain().toggleCodeBlock().run())}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={handleSave}
        disabled={isSaving}
        title="Save Note"
      >
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="More Options" className={undefined}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={undefined}>
          <DropdownMenuItem onClick={handleSave} className={undefined} inset={undefined}>
            <Save className="mr-2 h-4 w-4" />
            <span>Save</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate} className={undefined} inset={undefined}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport} className={undefined} inset={undefined}>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={undefined} />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive" inset={undefined}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="ml-auto flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={generateFlashcards}
          title="Create flashcards from your notes using the format 'Question :: Answer'"
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Generate Flashcards</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={generateQuiz}
          title="Create a quiz from your notes"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <span className="hidden sm:inline">Generate Quiz</span>
        </Button>
      </div>
    </div>
  );
}