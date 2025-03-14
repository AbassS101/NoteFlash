// src/components/editor/editor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote, 
  Code, 
  Save,
  BookOpen,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample data
const sampleFolders = [
  { id: '1', name: 'School' },
  { id: '2', name: 'Work' },
  { id: '3', name: 'Personal' }
];

// Sample note data
const sampleNotes = {
  '1': { 
    title: 'Getting Started with NoteFlash', 
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to NoteFlash' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is your first note. You can edit it or create new notes.' }
          ]
        }
      ]
    },
    folderId: '1'
  },
  '2': {
    title: 'Project Ideas',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Project Ideas' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'List of project ideas for the team.' }
          ]
        }
      ]
    },
    folderId: '2'
  },
  '3': {
    title: 'Meeting Notes',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Meeting Notes' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Notes from our weekly team meeting.' }
          ]
        }
      ]
    },
    folderId: '2'
  },
  '4': {
    title: 'Personal Goals',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Personal Goals' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'My personal goals for this year.' }
          ]
        }
      ]
    },
    folderId: '3'
  },
  '5': {
    title: 'Books to Read',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Books to Read' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'My reading list for the next few months.' }
          ]
        }
      ]
    },
    folderId: null
  }
};

interface EditorProps {
  noteId: string | null;
  onChange?: (content: any) => void;
  onSave?: (content: any) => void;
}

export const Editor: React.FC<EditorProps> = ({
  noteId,
  onChange,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('Untitled Note');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [editorContent, setEditorContent] = useState<any>(null);
  
  // Refs for timeout
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current note data based on noteId
  useEffect(() => {
    if (noteId && sampleNotes[noteId as keyof typeof sampleNotes]) {
      const note = sampleNotes[noteId as keyof typeof sampleNotes];
      setTitle(note.title);
      setSelectedFolder(note.folderId || '');
      setEditorContent(note.content);
    } else {
      setTitle('Untitled Note');
      setSelectedFolder('');
      setEditorContent({
        type: 'doc',
        content: [{ type: 'paragraph' }]
      });
    }
  }, [noteId]);
  
  // Initialize editor with basic extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      Image.configure({
        allowBase64: true,
      }),
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      if (onChange) {
        // Simple debounce implementation
        if (changeTimeoutRef.current) {
          clearTimeout(changeTimeoutRef.current);
        }
        
        changeTimeoutRef.current = setTimeout(() => {
          onChange(editor.getJSON());
        }, 300);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose dark:prose-invert focus:outline-none max-w-full p-4 min-h-[200px]',
        spellcheck: 'false',
      },
    },
  });

  // Update editor content when it changes
  useEffect(() => {
    if (editor && editorContent) {
      editor.commands.setContent(editorContent);
    }
  }, [editor, editorContent]);

  // Handle save
  const handleSave = () => {
    if (editor && onSave) {
      onSave(editor.getJSON());
    }
    
    // In a real app, you would save to a database
    console.log('Saving note:', {
      title,
      content: editor?.getJSON(),
      folderId: selectedFolder || null
    });
  };

  // Generate flashcards
  const handleGenerateFlashcards = () => {
    console.log('Generating flashcards for:', title);
    // In a real app, you would navigate to the flashcards page or open a modal
    window.location.href = '/flashcards';
  };

  // Generate quiz
  const handleGenerateQuiz = () => {
    console.log('Generating quiz for:', title);
    // In a real app, you would navigate to the quiz page or open a modal
    window.location.href = '/quizzes';
  };

  // Effect to simulate async loading to avoid UI freezing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  // Loading UI
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 w-full bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  // No note selected
  if (!noteId && !editor) {
    return (
      <div className="flex items-center justify-center h-full border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div>
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">No note selected</h3>
          <p className="text-gray-500 mt-2">Select a note from the list or create a new one to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container border border-gray-200 dark:border-gray-700 rounded-md">
      {/* Note Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-xl font-medium bg-transparent border-0 focus:outline-none focus:ring-0"
            placeholder="Untitled Note"
          />
          
          <Button
                      onClick={handleGenerateFlashcards}
                      variant="outline"
                      className="flex items-center gap-1" size={undefined}          >
            <BookOpen className="h-4 w-4" />
            <span>Flashcards</span>
          </Button>
          
          <Button
                      onClick={handleGenerateQuiz}
                      variant="outline"
                      className="flex items-center gap-1" size={undefined}          >
            <Brain className="h-4 w-4" />
            <span>Quiz</span>
          </Button>
          
          <Button
                      onClick={handleSave}
                      className="flex items-center gap-1" variant={undefined} size={undefined}          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Folder:</span>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm py-0"
            >
              <option value="">Uncategorized</option>
              {sampleFolders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
          
          <div className="text-xs text-gray-400 ml-auto">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Editor Toolbar */}
      <div className="editor-toolbar bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1 items-center border-b border-gray-200 dark:border-gray-700">
        {/* Basic formatting buttons */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* Heading buttons */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* List buttons */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* Additional formatting */}
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 ${editor?.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor Content */}
      <div className="overflow-auto max-h-[calc(100vh-16rem)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Editor;