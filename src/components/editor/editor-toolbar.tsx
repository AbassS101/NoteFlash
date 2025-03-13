// src/components/editor/editor-toolbar.tsx
'use client';

import React, { useState, ChangeEvent } from 'react';
import { type Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Quote, Code, Undo, Redo,
  Copy, FileDown, Trash2, MoreHorizontal, CreditCard, 
  Image, Link as LinkIcon, Table as TableIcon, 
  HelpCircle, Heading1, Heading2, Heading3, TextIcon, 
  FileText, Save
} from 'lucide-react';
import { useNoteStore } from '@/store/note-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useFlashcardStore } from '@/store/flashcard-store';
import { useQuizStore } from '@/store/quiz-store';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Define types for flashcard and quiz generation
interface QuizQuestionType {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface EditorToolbarProps {
  editor: Editor | null;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

// Create a simple styled button with title attribute for tooltips
function ToolbarButton({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  title, 
  children 
}: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClick}
            className={isActive ? 'bg-muted' : undefined}
            disabled={disabled}
            aria-label={title}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function EditorToolbar({ editor, isSaving, onSave }: EditorToolbarProps) {
  const { currentNote, deleteNote, createNote } = useNoteStore();
  const { addFlashcard } = useFlashcardStore();
  const { createQuiz } = useQuizStore();
  const { toast } = useToast();
  const confirm = useConfirm();
  
  // State for dialogs
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  const [isAddImageDialogOpen, setIsAddImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  
  const [isAutoFlashcardDialogOpen, setIsAutoFlashcardDialogOpen] = useState(false);
  const [flashcardDelimiter, setFlashcardDelimiter] = useState('::');
  const [flashcardDeck, setFlashcardDeck] = useState(currentNote?.title || 'Default');

  // Ensure editor and currentNote exist before rendering
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
    setIsAutoFlashcardDialogOpen(true);
  };
  
  const executeFlashcardGeneration = () => {
    // Improved flashcard extraction logic
    const content = editor.getText();
    const lines = content.split('\n');
    
    let newCount = 0;
    lines.forEach(line => {
      if (line.includes(flashcardDelimiter)) {
        const parts = line.split(flashcardDelimiter).map(part => part.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          addFlashcard(parts[0], parts[1], flashcardDeck);
          newCount++;
        }
      }
    });
    
    if (newCount > 0) {
      toast({
        title: "Flashcards created",
        description: `${newCount} flashcards have been created from your note and added to the "${flashcardDeck}" deck.`,
      });
    } else {
      toast({
        title: "No flashcards found",
        description: `No flashcard patterns found. Use the format "Question ${flashcardDelimiter} Answer" in your notes.`,
      });
    }
    
    setIsAutoFlashcardDialogOpen(false);
  };

  const generateQuiz = () => {
    // Generate a quiz from flashcards
    try {
      // Extract potential questions from the content
      const content = editor.getText();
      const lines = content.split('\n');
      
      const questions: QuizQuestionType[] = [];
      lines.forEach(line => {
        if (line.includes('::')) {
          const parts = line.split('::').map(part => part.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            // Create a question with the correct answer and some distractors
            questions.push({
              id: Date.now().toString(36) + Math.random().toString(36).substr(2),
              text: parts[0],
              options: [
                parts[1], 
                `Incorrect answer for ${parts[0]}`, 
                `Another wrong answer`, 
                `Yet another option`
              ],
              correctAnswer: parts[1]
            });
          }
        }
      });
      
      if (questions.length > 0) {
        const quizTitle = `Quiz from ${currentNote.title}`;
        createQuiz(
          quizTitle,
          `Automatically generated from "${currentNote.title}" note`,
          questions,
          15 // Default time limit of 15 minutes
        );
        
        toast({
          title: "Quiz created",
          description: `Quiz "${quizTitle}" has been created with ${questions.length} questions.`,
        });
      } else {
        toast({
          title: "No questions found",
          description: "No questions could be generated from your notes. Use 'Question :: Answer' format.",
        });
      }
    } catch (error) {
      toast({
        title: "Error generating quiz",
        description: "Failed to generate quiz from your notes.",
        variant: "destructive",
      });
    }
  };

  const handleAddLink = () => {
    if (linkUrl) {
      // If no text is selected, use the URL as the text
      if (!linkText && editor.state.selection.empty) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`)
          .run();
      } else {
        // If text is selected, create a link with the selected text
        const selectedText = editor.view.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          ' '
        );
        
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}" target="_blank">${linkText || selectedText || linkUrl}</a>`)
          .run();
      }
      
      setIsAddLinkDialogOpen(false);
      setLinkUrl('');
      setLinkText('');
    }
  };
  
  const handleAddImage = () => {
    if (imageUrl) {
      editor
        .chain()
        .focus()
        .insertContent(`<img src="${imageUrl}" alt="${imageAlt || 'Image'}" />`)
        .run();
      
      setIsAddImageDialogOpen(false);
      setImageUrl('');
      setImageAlt('');
    }
  };
  
  const handleAddTable = () => {
    if (tableRows > 0 && tableCols > 0) {
      // Create HTML table structure manually
      let tableHtml = '<table><tbody>';
      
      for (let i = 0; i < tableRows; i++) {
        tableHtml += '<tr>';
        for (let j = 0; j < tableCols; j++) {
          tableHtml += '<td>Cell</td>';
        }
        tableHtml += '</tr>';
      }
      
      tableHtml += '</tbody></table>';
      
      editor
        .chain()
        .focus()
        .insertContent(tableHtml)
        .run();
      
      setIsAddTableDialogOpen(false);
    }
  };

  // Force an explicit focus to ensure commands work properly
  const ensureFocus = (callback: () => void) => {
    editor.commands.focus();
    callback();
  };

  // Headings dropdown component
  function HeadingDropdown({ editor }: { editor: Editor }) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={editor.isActive('heading') ? 'bg-muted' : undefined}
                  aria-label="Heading format"
                >
                  <TextIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              Format
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent className="min-w-[180px]">
          <DropdownMenuLabel className={undefined} inset={undefined}>Heading</DropdownMenuLabel>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 1 }).run())}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            <span className="text-xl font-bold">Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 2 }).run())}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            <span className="text-lg font-bold">Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 3 }).run())}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <Heading3 className="h-4 w-4 mr-2" />
            <span className="text-base font-bold">Heading 3</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().setParagraph().run())}
            className={editor.isActive('paragraph') ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <TextIcon className="h-4 w-4 mr-2" />
            <span>Normal text</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={undefined} />
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleCode().run())}
            className={editor.isActive('code') ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <Code className="h-4 w-4 mr-2" />
            <span>Inline Code</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleCodeBlock().run())}
            className={editor.isActive('codeBlock') ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Code Block</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => ensureFocus(() => editor.chain().toggleBlockquote().run())}
            className={editor.isActive('blockquote') ? 'bg-muted' : undefined}
            inset={undefined}
          >
            <Quote className="h-4 w-4 mr-2" />
            <span>Quote</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
    <div className="border-b flex items-center p-2 gap-1 flex-wrap bg-muted/30">
      {/* Primary Controls */}
      <div className="flex items-center mr-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-8"
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Save"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </Button>
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Undo/Redo */}
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
      
      {/* Text Style */}
      <div className="flex items-center gap-1">
        {/* Heading Dropdown */}
        <HeadingDropdown editor={editor} />
        
        {/* Text Formatting */}
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
      
      {/* Lists */}
      <div className="flex items-center gap-1">
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
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Insert Functions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => setIsAddLinkDialogOpen(true)}
          isActive={editor.isActive('link')}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => setIsAddImageDialogOpen(true)}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => setIsAddTableDialogOpen(true)}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* More Actions Dropdown */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost"
                    size="icon"
                    aria-label="More Options" className={undefined}                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <span>More Options</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className={undefined}>
          <DropdownMenuItem onSelect={handleDuplicate} inset={undefined} className={undefined}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport} inset={undefined} className={undefined}>
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
              onSelect={() => ensureFocus(() => editor.chain().selectAll().run())}
              inset={undefined} className={undefined}          >
            <span className="mr-2">⌘A</span>
            <span>Select All</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={undefined} />
          <DropdownMenuItem onSelect={handleDelete} className="text-destructive focus:text-destructive" inset={undefined}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={generateFlashcards}
                aria-label="Generate Flashcards"
              >
                <CreditCard className="h-4 w-4" />
                <span>Generate Flashcards</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Create flashcards from your notes</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={generateQuiz}
                aria-label="Generate Quiz"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Generate Quiz</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Create a quiz from your notes</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
    
    {/* Link Dialog */}
    <Dialog open={isAddLinkDialogOpen} onOpenChange={setIsAddLinkDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Insert Link</DialogTitle>
          <DialogDescription className={undefined}>
            Add a link to your note
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url" className={undefined}>URL</Label>
            <Input
                id="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
                className={undefined}
                type="text"
            />
          </div>
          {editor.state.selection.empty && (
            <div className="grid gap-2">
              <Label htmlFor="text" className={undefined}>Text</Label>
              <Input
                  id="text"
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkText(e.target.value)}
                  className={undefined}
                  type="text"
              />
            </div>
          )}
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsAddLinkDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={handleAddLink} className={undefined} variant={undefined} size={undefined}>Insert Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Image Dialog */}
    <Dialog open={isAddImageDialogOpen} onOpenChange={setIsAddImageDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Insert Image</DialogTitle>
          <DialogDescription className={undefined}>
            Add an image to your note
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="image-url" className={undefined}>Image URL</Label>
            <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
                className={undefined}
                type="text"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image-alt" className={undefined}>Alt Text</Label>
            <Input
                id="image-alt"
                placeholder="Image description"
                value={imageAlt}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImageAlt(e.target.value)}
                className={undefined}
                type="text"
            />
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsAddImageDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={handleAddImage} className={undefined} variant={undefined} size={undefined}>Insert Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Table Dialog */}
    <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Insert Table</DialogTitle>
          <DialogDescription className={undefined}>
            Add a table to your note
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rows" className={undefined}>Rows</Label>
            <Input
                id="rows"
                type="number"
                min="1"
                max="10"
                value={tableRows}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTableRows(parseInt(e.target.value) || 3)}
                className={undefined}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="columns" className={undefined}>Columns</Label>
            <Input
                id="columns"
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTableCols(parseInt(e.target.value) || 3)}
                className={undefined}
            />
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsAddTableDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={handleAddTable} className={undefined} variant={undefined} size={undefined}>Insert Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Auto Flashcard Dialog */}
    <Dialog open={isAutoFlashcardDialogOpen} onOpenChange={setIsAutoFlashcardDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Generate Flashcards</DialogTitle>
          <DialogDescription className={undefined}>
            Automatically create flashcards from your notes
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="delimiter" className={undefined}>Delimiter</Label>
            <Input
                id="delimiter"
                placeholder="::"
                value={flashcardDelimiter}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFlashcardDelimiter(e.target.value)}
                className={undefined}
                type="text"
            />
            <p className="text-xs text-muted-foreground">
              The delimiter separates the front and back of each flashcard. Default is "::"
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deck" className={undefined}>Deck Name</Label>
            <Input
                id="deck"
                placeholder="Default"
                value={flashcardDeck}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFlashcardDeck(e.target.value)}
                className={undefined}
                type="text"
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">How to use:</p>
            <p className="text-sm text-muted-foreground">
              Format your notes with questions and answers separated by the delimiter. For example:
            </p>
            <p className="text-sm bg-background p-2 rounded mt-1">
              What is the capital of France? {flashcardDelimiter} Paris
            </p>
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsAutoFlashcardDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={executeFlashcardGeneration} className={undefined} variant={undefined} size={undefined}>Generate Flashcards</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}