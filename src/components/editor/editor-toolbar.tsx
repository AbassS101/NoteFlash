// src/components/editor/editor-toolbar.tsx
'use client';

import React, { useState, ChangeEvent } from 'react';
import { type Editor, JSONContent } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Quote, Code, Undo, Redo, Save, 
  Copy, FileDown, Trash2, MoreHorizontal, CreditCard, 
  Image, Link as LinkIcon, Calendar, Table as TableIcon, 
  HelpCircle, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, TextIcon, Highlighter,
  CheckSquare, IndentIncrease, IndentDecrease, ListChecks,
  Palette, FileText, Download, Upload, FileUp, Sparkles,
  Star, Bookmark, Share2, ExternalLink, Braces, Paperclip,
  PenTool, ChevronDown
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
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useFlashcardStore } from '@/store/flashcard-store';
import { useQuizStore } from '@/store/quiz-store';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

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

// Create a styled button with tooltip
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

// Improved Checkbox component with proper typing
function Checkbox({ 
  id, 
  checked, 
  onCheckedChange, 
  label 
}: { 
  id: string, 
  checked?: boolean, 
  onCheckedChange?: (checked: boolean) => void,
  label?: string 
}) {
  return (
    <div className="flex items-center space-x-2">
      <input 
        type="checkbox" 
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        aria-label={label}
      />
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
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
  const [includeHeaderRow, setIncludeHeaderRow] = useState(true);

  const [isAutoFlashcardDialogOpen, setIsAutoFlashcardDialogOpen] = useState(false);
  const [flashcardDelimiter, setFlashcardDelimiter] = useState('::');
  const [flashcardDeck, setFlashcardDeck] = useState(currentNote?.title || 'Default');
  const [autoGenerateFromHeadings, setAutoGenerateFromHeadings] = useState(false);

  // Quiz generation dialog
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [includeCustomQuestions, setIncludeCustomQuestions] = useState(true);

  // Color picker states
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isHighlighterOpen, setIsHighlighterOpen] = useState(false);

  // Export options state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  // AI options - new feature
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiAction, setAIAction] = useState('summarize');

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
    setExportFormat('json');
    setIsExportDialogOpen(true);
  };

  const executeExport = () => {
    try {
      const { title, content } = currentNote;
      let exportData, fileName, mimeType;
      
      switch (exportFormat) {
        case 'json':
          exportData = JSON.stringify(content, null, 2);
          fileName = `${title}.json`;
          mimeType = 'application/json';
          break;
        case 'markdown':
          // Simple markdown conversion - in a real app, use a proper HTML to MD converter
          const text = editor.getText();
          exportData = text;
          fileName = `${title}.md`;
          mimeType = 'text/markdown';
          break;
        case 'html':
          exportData = editor.getHTML();
          fileName = `${title}.html`;
          mimeType = 'text/html';
          break;
        case 'text':
          exportData = editor.getText();
          fileName = `${title}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          exportData = JSON.stringify(content, null, 2);
          fileName = `${title}.json`;
          mimeType = 'application/json';
      }
      
      // Create a blob and download it
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Note exported",
        description: `Your note has been exported as a ${exportFormat.toUpperCase()} file.`,
      });
      
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error exporting note",
        description: "Failed to export your note.",
        variant: "destructive",
      });
    }
  };

  const generateFlashcards = () => {
    setFlashcardDeck(currentNote?.title || 'Default');
    setAutoGenerateFromHeadings(false);
    setIsAutoFlashcardDialogOpen(true);
  };
  
  // Type-safe processing of JSON content
  const processJsonContent = (json: JSONContent | undefined): { content: any[] } => {
    if (!json || !json.content) {
      return { content: [] };
    }
    return { content: json.content };
  };

  const executeFlashcardGeneration = () => {
    // Improved flashcard extraction logic
    const content = editor?.getText() || '';
    const lines = content.split('\n');
    
    let newCount = 0;
    
    // Extract flashcards from delimiter-separated content
    lines.forEach(line => {
      if (line.includes(flashcardDelimiter)) {
        const parts = line.split(flashcardDelimiter).map(part => part.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          addFlashcard(parts[0], parts[1], flashcardDeck);
          newCount++;
        }
      }
    });
    
    // Auto-generate from headings if selected
    if (autoGenerateFromHeadings) {
      // Find all headings and their content
      const jsonContent = processJsonContent(editor?.getJSON());
      let currentHeading: any = null;
      let currentContent: string[] = [];
      
      if (jsonContent.content) {
        jsonContent.content.forEach((node: any) => {
          if (node.type === 'heading') {
            // If we have a previous heading with content, create a flashcard
            if (currentHeading && currentContent.length > 0) {
              const headingText = currentHeading.content?.map((c: any) => c.text).join(' ') || '';
              const contentText = currentContent.join('\n');
              
              if (headingText && contentText) {
                addFlashcard(headingText, contentText, flashcardDeck);
                newCount++;
              }
            }
            
            // Start a new heading group
            currentHeading = node;
            currentContent = [];
          } else if (currentHeading && node.type === 'paragraph') {
            // Add content to current heading
            const text = node.content?.map((c: any) => c.text).join(' ') || '';
            if (text) {
              currentContent.push(text);
            }
          }
        });
        
        // Process the last heading if any
        if (currentHeading && currentContent.length > 0) {
          const headingText = currentHeading.content?.map((c: any) => c.text).join(' ') || '';
          const contentText = currentContent.join('\n');
          
          if (headingText && contentText) {
            addFlashcard(headingText, contentText, flashcardDeck);
            newCount++;
          }
        }
      }
    }
    
    if (newCount > 0) {
      toast({
        title: "Flashcards created",
        description: `${newCount} flashcards have been created from your note and added to the "${flashcardDeck}" deck.`,
      });
    } else {
      toast({
        title: "No flashcards found",
        description: `No flashcard patterns found. Use the format "Question ${flashcardDelimiter} Answer" in your notes or enable the heading option.`,
      });
    }
    
    setIsAutoFlashcardDialogOpen(false);
  };

  const generateQuiz = () => {
    // Initialize quiz dialog values
    setQuizTitle(`Quiz from ${currentNote.title}`);
    setQuestionCount(10);
    setTimeLimit(15);
    setIncludeCustomQuestions(true);
    setIsQuizDialogOpen(true);
  };
  
  const executeQuizGeneration = () => {
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
      
      // Limit number of questions to requested count
      const finalQuestions = questions.slice(0, questionCount);
      
      if (finalQuestions.length > 0) {
        createQuiz(
          quizTitle,
          `Automatically generated from "${currentNote.title}" note`,
          finalQuestions,
          timeLimit
        );
        
        toast({
          title: "Quiz created",
          description: `Quiz "${quizTitle}" has been created with ${finalQuestions.length} questions.`,
        });
        
        setIsQuizDialogOpen(false);
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

  // AI helper functions
  const handleAIHelper = () => {
    setAIPrompt('');
    setAIAction('summarize');
    setIsAIDialogOpen(true);
  };
  
  const executeAIAction = () => {
    const selectedText = editor.state.selection.empty 
      ? editor.getText() 
      : editor.view.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          ' '
        );
        
    let result = '';
    
    // This is just a mockup of what AI functionality could look like
    // In a real app, this would call an API
    switch (aiAction) {
      case 'summarize':
        result = `Summary of ${selectedText.slice(0, 20)}...: This would be an AI-generated summary.`;
        break;
      case 'expand':
        result = `${selectedText}\n\nExpanded content: This would be AI-generated expanded content based on the original text.`;
        break;
      case 'proofread':
        result = `Proofread version: ${selectedText}`;
        break;
      case 'custom':
        result = `Response to prompt "${aiPrompt}": This would be the AI response to your custom prompt.`;
        break;
    }
    
    // Insert the result at cursor position
    if (result) {
      editor.chain().focus().insertContent(result).run();
      
      toast({
        title: "AI action completed",
        description: `The ${aiAction} action has been applied to your text.`,
      });
    }
    
    setIsAIDialogOpen(false);
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
        .setImage({ src: imageUrl, alt: imageAlt || 'Image' })
        .run();
      
      setIsAddImageDialogOpen(false);
      setImageUrl('');
      setImageAlt('');
    }
  };
  
  const handleAddTable = () => {
    if (tableRows > 0 && tableCols > 0) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: includeHeaderRow })
        .run();
      
      setIsAddTableDialogOpen(false);
    }
  };

  const insertDate = () => {
    const currentDate = new Date().toLocaleDateString();
    editor
      .chain()
      .focus()
      .insertContent(currentDate)
      .run();
  };

  // Force an explicit focus to ensure commands work properly
  const ensureFocus = (callback: () => void) => {
    editor.commands.focus();
    callback();
  };

  // Text alignment
  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    ensureFocus(() => {
      editor.chain().setTextAlign(align).run();
    });
  };

  // Text color
  const setTextColor = (color: string) => {
    ensureFocus(() => {
      editor.chain().setColor(color).run();
    });
  };

  // Text highlight (background color)
  const setHighlight = (color: string) => {
    ensureFocus(() => {
      editor.chain().setHighlight({ color }).run();
    });
  };

  // Functionality for clear formatting
  const clearFormatting = () => {
    ensureFocus(() => {
      editor.chain().clearNodes().unsetAllMarks().run();
    });
  };

  return (
    <>
    {/* Main Toolbar */}
    <div className="border-b flex items-center p-2 gap-1 flex-wrap bg-muted/30 justify-between">
      {/* Left side - Common editing tools */}
      <div className="flex items-center flex-wrap gap-1">
        {/* Save Button */}
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
        
        {/* Format Dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={editor.isActive('heading') ? 'bg-muted' : undefined}
                    aria-label="Format"
                  >
                    <TextIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Format</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent className="min-w-[180px]">
            <DropdownMenuLabel className={undefined} inset={undefined}>Paragraph Format</DropdownMenuLabel>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 1 }).run())}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : undefined} inset={undefined}            >
              <Heading1 className="h-4 w-4 mr-2" />
              <span className="text-xl font-bold">Heading 1</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 2 }).run())}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : undefined} inset={undefined}            >
              <Heading2 className="h-4 w-4 mr-2" />
              <span className="text-lg font-bold">Heading 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleHeading({ level: 3 }).run())}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : undefined} inset={undefined}            >
              <Heading3 className="h-4 w-4 mr-2" />
              <span className="text-base font-bold">Heading 3</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().setParagraph().run())}
                className={editor.isActive('paragraph') ? 'bg-muted' : undefined} inset={undefined}            >
              <TextIcon className="h-4 w-4 mr-2" />
              <span>Normal text</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={undefined} />
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleBlockquote().run())}
                className={editor.isActive('blockquote') ? 'bg-muted' : undefined} inset={undefined}            >
              <Quote className="h-4 w-4 mr-2" />
              <span>Quote</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleCode().run())}
                className={editor.isActive('code') ? 'bg-muted' : undefined} inset={undefined}            >
              <Code className="h-4 w-4 mr-2" />
              <span>Inline Code</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().toggleCodeBlock().run())}
                className={editor.isActive('codeBlock') ? 'bg-muted' : undefined} inset={undefined}            >
              <Braces className="h-4 w-4 mr-2" />
              <span>Code Block</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={undefined} />
            <DropdownMenuItem onSelect={clearFormatting} className={undefined} inset={undefined}>
              <span className="mr-2">⌘\</span>
              <span>Clear formatting</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Text Style */}
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
            onClick={() => ensureFocus(() => editor.chain().toggleUnderline().run())}
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
          
          {/* Text Color */}
          <DropdownMenu open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative"
                      aria-label="Text Color"
                    >
                      <Palette className="h-4 w-4" />
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-5 h-1 rounded-sm bg-black"></div>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Text Color</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className={undefined}>
              <div className="grid grid-cols-5 gap-1 p-2">
                {["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
                  "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#008000", 
                  "#800000", "#008080", "#000080", "#FFC0CB", "#A52A2A", 
                  "#808080", "#D3D3D3", "#FFFFFF"].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-sm border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor(color);
                      setIsColorPickerOpen(false);
                    }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Highlighter */}
          <DropdownMenu open={isHighlighterOpen} onOpenChange={setIsHighlighterOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost"
                        size="icon"
                        aria-label="Highlight" className={undefined}                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Highlight</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className={undefined}>
              <div className="grid grid-cols-5 gap-1 p-2">
                {["#ffff00", "#ff9900", "#ff0000", "#99cc00", "#33ccff", 
                  "#9933ff", "#ff99cc", "#e6e6e6", "#ccffcc", "#ccffff", 
                  "#ffffcc"].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-sm border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setHighlight(color);
                      setIsHighlighterOpen(false);
                    }}
                    aria-label={`Highlight ${color}`}
                  />
                ))}
                <button
                  className="w-6 h-6 rounded-sm border border-gray-300 cursor-pointer flex items-center justify-center bg-white"
                  onClick={() => {
                    ensureFocus(() => editor.chain().unsetHighlight().run());
                    setIsHighlighterOpen(false);
                  }}
                  aria-label="Remove highlight"
                >
                  ✕
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* Alignment */}
        <div className="hidden sm:flex items-center gap-1">
          <ToolbarButton
            onClick={() => setTextAlign('left')}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setTextAlign('center')}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setTextAlign('right')}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setTextAlign('justify')}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>
        
        {/* Alignment Dropdown for Mobile */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Text alignment" className={undefined}>
                <AlignLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={undefined}>
              <DropdownMenuItem 
                  onSelect={() => setTextAlign('left')}
                  className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : undefined} inset={undefined}              >
                <AlignLeft className="h-4 w-4 mr-2" />
                <span>Align Left</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                  onSelect={() => setTextAlign('center')}
                  className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : undefined} inset={undefined}              >
                <AlignCenter className="h-4 w-4 mr-2" />
                <span>Align Center</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                  onSelect={() => setTextAlign('right')}
                  className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : undefined} inset={undefined}              >
                <AlignRight className="h-4 w-4 mr-2" />
                <span>Align Right</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                  onSelect={() => setTextAlign('justify')}
                  className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : undefined} inset={undefined}              >
                <AlignJustify className="h-4 w-4 mr-2" />
                <span>Justify</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <ToolbarButton
            onClick={() => ensureFocus(() => editor.chain().toggleTaskList().run())}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <ListChecks className="h-4 w-4" />
          </ToolbarButton>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* Insert Menu */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Insert" className={undefined}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Insert</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent className={undefined}>
            <DropdownMenuItem onSelect={() => setIsAddLinkDialogOpen(true)} className={undefined} inset={undefined}>
              <LinkIcon className="h-4 w-4 mr-2" />
              <span>Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsAddImageDialogOpen(true)} className={undefined} inset={undefined}>
              <Image className="h-4 w-4 mr-2" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsAddTableDialogOpen(true)} className={undefined} inset={undefined}>
              <TableIcon className="h-4 w-4 mr-2" />
              <span>Table</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={insertDate} className={undefined} inset={undefined}>
              <Calendar className="h-4 w-4 mr-2" />
              <span>Date</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Visible buttons for Link, Image, Table */}
        <div className="hidden md:flex items-center gap-1">
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
        
        {/* AI Helper - New Feature */}
        <ToolbarButton
          onClick={handleAIHelper}
          title="AI Assistant"
        >
          <Sparkles className="h-4 w-4" />
        </ToolbarButton>
        
        {/* More Actions */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button 
                      variant="ghost"
                      size="icon"
                      aria-label="More Options" className={undefined}                  >
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
            <DropdownMenuItem onSelect={handleSave} className={undefined} inset={undefined}>
              <Save className="mr-2 h-4 w-4" />
              <span>Save</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDuplicate} className={undefined} inset={undefined}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExport} className={undefined} inset={undefined}>
              <FileDown className="mr-2 h-4 w-4" />
              <span>Export</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={undefined} />
            <DropdownMenuItem onSelect={clearFormatting} className={undefined} inset={undefined}>
              <PenTool className="mr-2 h-4 w-4" />
              <span>Clear formatting</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                onSelect={() => ensureFocus(() => editor.chain().selectAll().run())} className={undefined} inset={undefined}            >
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
      </div>

      {/* Right side - Flashcard & Quiz Generation */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateFlashcards}
          className="whitespace-nowrap"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Generate Flashcards</span>
          <span className="sm:hidden">Flashcards</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateQuiz}
          className="whitespace-nowrap"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Generate Quiz</span>
          <span className="sm:hidden">Quiz</span>
        </Button>
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
                type="text" className={undefined}            />
          </div>
          {editor.state.selection.empty && (
            <div className="grid gap-2">
              <Label htmlFor="text" className={undefined}>Text</Label>
              <Input
                  id="text"
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkText(e.target.value)}
                  type="text" className={undefined}              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox id="external" />
            <label
              htmlFor="external"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Open in new tab
            </label>
          </div>
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
                type="text" className={undefined}            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image-alt" className={undefined}>Alt Text</Label>
            <Input
                id="image-alt"
                placeholder="Image description"
                value={imageAlt}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImageAlt(e.target.value)}
                type="text" className={undefined}            />
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTableRows(parseInt(e.target.value) || 3)} className={undefined}            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="columns" className={undefined}>Columns</Label>
            <Input
                id="columns"
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTableCols(parseInt(e.target.value) || 3)} className={undefined}            />
          </div>
          <div className="flex items-center space-x-2">
          <Checkbox 
  id="header-row" 
  checked={includeHeaderRow}
  onCheckedChange={setIncludeHeaderRow}
/>
            <label
              htmlFor="header-row"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include header row
            </label>
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
    
    {/* Flashcard Dialog */}
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
            <Label htmlFor="deck" className={undefined}>Deck Name</Label>
            <Input
                id="deck"
                placeholder="Default"
                value={flashcardDeck}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFlashcardDeck(e.target.value)}
                type="text" className={undefined}            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="delimiter" className={undefined}>Delimiter</Label>
            <Input
                id="delimiter"
                placeholder="::"
                value={flashcardDelimiter}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFlashcardDelimiter(e.target.value)}
                type="text" className={undefined}            />
            <p className="text-xs text-muted-foreground">
              The delimiter separates the front and back of each flashcard. Default is "::"
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
                id="auto-headings"
                checked={autoGenerateFromHeadings}
                onCheckedChange={setAutoGenerateFromHeadings} className={undefined}            />
            <Label htmlFor="auto-headings" className={undefined}>
              Auto-generate from headings
            </Label>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">How to create flashcards:</p>
            <p className="text-sm text-muted-foreground">
              1. Use delimiter format: Question {flashcardDelimiter} Answer
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              2. Or enable auto-generate to create cards from headings and their content.
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
    
    {/* Quiz Dialog */}
    <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Generate Quiz</DialogTitle>
          <DialogDescription className={undefined}>
            Create a quiz from your notes
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quiz-title" className={undefined}>Quiz Title</Label>
            <Input
                id="quiz-title"
                value={quizTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuizTitle(e.target.value)}
                type="text" className={undefined}            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="question-count" className={undefined}>Number of Questions</Label>
            <Input
                id="question-count"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestionCount(parseInt(e.target.value) || 10)} className={undefined}            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="time-limit" className={undefined}>Time Limit (minutes)</Label>
            <Input
                id="time-limit"
                type="number"
                min="1"
                max="120"
                value={timeLimit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTimeLimit(parseInt(e.target.value) || 15)} className={undefined}            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
                id="custom-questions"
                checked={includeCustomQuestions}
                onCheckedChange={setIncludeCustomQuestions} className={undefined}            />
            <Label htmlFor="custom-questions" className={undefined}>
              Include questions from note content
            </Label>
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={executeQuizGeneration} className={undefined} variant={undefined} size={undefined}>Create Quiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Export Dialog */}
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>Export Note</DialogTitle>
          <DialogDescription className={undefined}>
            Choose a format to export your note
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="export-format" className={undefined}>Format</Label>
            <select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="json">JSON (Structured Data)</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
              <option value="text">Plain Text</option>
            </select>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Format Information</p>
            {exportFormat === 'json' && (
              <p className="text-xs text-muted-foreground mt-1">
                JSON format preserves all formatting and structure, ideal for re-importing.
              </p>
            )}
            {exportFormat === 'markdown' && (
              <p className="text-xs text-muted-foreground mt-1">
                Markdown is a lightweight markup language that's readable and portable.
              </p>
            )}
            {exportFormat === 'html' && (
              <p className="text-xs text-muted-foreground mt-1">
                HTML preserves formatting and can be viewed in any web browser.
              </p>
            )}
            {exportFormat === 'text' && (
              <p className="text-xs text-muted-foreground mt-1">
                Plain text contains only the content without any formatting.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={executeExport} className={undefined} variant={undefined} size={undefined}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* AI Helper Dialog */}
    <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={undefined}>
          <DialogTitle className={undefined}>AI Assistant</DialogTitle>
          <DialogDescription className={undefined}>
            Use AI to help with your writing
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-action" className={undefined}>Action</Label>
            <select
              id="ai-action"
              value={aiAction}
              onChange={(e) => setAIAction(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="summarize">Summarize</option>
              <option value="expand">Expand</option>
              <option value="proofread">Proofread</option>
              <option value="custom">Custom Prompt</option>
            </select>
          </div>
          
          {aiAction === 'custom' && (
            <div className="grid gap-2">
              <Label htmlFor="ai-prompt" className={undefined}>Custom Prompt</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Enter your instructions for the AI..."
                value={aiPrompt}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setAIPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">AI Assistant Information</p>
            <p className="text-xs text-muted-foreground mt-1">
              The AI will process the {editor.state.selection.empty ? "entire note" : "selected text"} based on the action you choose.
            </p>
            {aiAction === 'summarize' && (
              <p className="text-xs text-muted-foreground mt-1">
                Summarize will create a concise version of your text.
              </p>
            )}
            {aiAction === 'expand' && (
              <p className="text-xs text-muted-foreground mt-1">
                Expand will add more detail and context to your text.
              </p>
            )}
            {aiAction === 'proofread' && (
              <p className="text-xs text-muted-foreground mt-1">
                Proofread will correct spelling, grammar, and style issues.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setIsAIDialogOpen(false)} className={undefined} size={undefined}>
            Cancel
          </Button>
          <Button onClick={executeAIAction} className={undefined} variant={undefined} size={undefined}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}