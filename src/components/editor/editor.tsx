// src/components/editor/editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { useSettingsStore } from '@/store/setting-store';
import EditorToolbar from './editor-toolbar';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils/utils';
import React from 'react';
import { Extensions, Mark, mergeAttributes } from '@tiptap/core';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit2, Check } from 'lucide-react';

// Create a simple mark extension for underline
const Underline = Mark.create({
  name: 'underline',
  
  // Define how this mark is parsed from HTML
  parseHTML() {
    return [
      { tag: 'u' },
      { style: 'text-decoration: underline' },
    ];
  },
  
  // Define how this mark is rendered to HTML
  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(HTMLAttributes), 0];
  },
  
  // Add keyboard shortcuts for this mark
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleMark(this.name),
    };
  },
});

export default function Editor() {
  const { currentNote, updateNote, saveNote } = useNoteStore();
  const { autoSave, fontSize } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });

  // Define extensions with proper type annotations and configuration
  const extensions: Extensions = [
    StarterKit.configure({
      bulletList: { 
        keepMarks: true,
        keepAttributes: true,
      },
      orderedList: { 
        keepMarks: true,
        keepAttributes: true,
      },
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'language-javascript',
        },
      },
    }),
    Underline, 
    Placeholder.configure({
      placeholder: 'Start typing your notes here...',
    }),
  ];

  // Set up Tiptap editor with necessary extensions
  const editor = useEditor({
    extensions,
    content: currentNote?.content || '',
    autofocus: 'end',
    editable: true,
    onUpdate: ({ editor }) => {
      if (currentNote) {
        updateNote(currentNote.id, { content: editor.getJSON() });
        
        // Update word count
        const text = editor.getText();
        setWordCount({
          words: text.split(/\s+/).filter(word => word.length > 0).length,
          characters: text.length
        });
        
        if (autoSave) {
          debouncedSave();
        }
      }
    },
  });

  // Update editor content when current note changes
  useEffect(() => {
    if (editor && currentNote) {
      // Only update if the content is different to avoid cursor jumping
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(currentNote.content);
      
      if (currentContent !== newContent) {
        editor.commands.setContent(currentNote.content);
      }
      
      // Update title
      setTitleValue(currentNote.title);
      
      // Update word count
      const text = editor.getText();
      setWordCount({
        words: text.split(/\s+/).filter(word => word.length > 0).length,
        characters: text.length
      });
    }
  }, [editor, currentNote]);

  // Auto-save functionality
  const debouncedSave = useDebouncedCallback(async () => {
    if (currentNote) {
      setIsSaving(true);
      await saveNote();
      setIsSaving(false);
    }
  }, 2000);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  // Save title changes
  const saveTitle = () => {
    if (currentNote && titleValue.trim() !== '') {
      updateNote(currentNote.id, { title: titleValue });
      setIsEditingTitle(false);
    }
  };

  // Font size classes based on settings
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[fontSize];

  if (!currentNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a note or create a new one to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Note Title Editor */}
      <div className="p-2 border-b flex items-center">
        {isEditingTitle ? (
          <div className="flex w-full gap-2">
            <Input
              value={titleValue}
              onChange={handleTitleChange}
              placeholder="Note title"
              className="text-xl font-bold"
              autoFocus
              onKeyDown={(e: { key: string; }) => {
                if (e.key === 'Enter') {
                  saveTitle();
                }
              } } type={undefined}            />
            <Button variant="ghost" size="icon" onClick={saveTitle} className={undefined}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <h1 className="text-xl font-bold truncate">{currentNote.title}</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)} className={undefined}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} isSaving={isSaving} onSave={saveNote} />
      
      {/* Editor Content */}
      <div className="flex-1 overflow-auto border rounded-md p-4 bg-background flex flex-col">
        <style jsx global>{`
          /* Custom editor styles to properly render headings, lists, etc. */
          .ProseMirror {
            min-height: 300px;
            height: 100%;
            outline: none;
          }
          
          /* Headings */
          .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
          }
          .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
          }
          .ProseMirror h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 1em;
          }
          
          /* Lists */
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .ProseMirror li {
            margin-bottom: 0.5em;
          }
          
          /* Blockquote */
          .ProseMirror blockquote {
            border-left: 3px solid #b8b8b8;
            padding-left: 1em;
            margin-left: 0;
            margin-right: 0;
            font-style: italic;
          }
          
          /* Code block */
          .ProseMirror pre {
            background-color: #f1f1f1;
            padding: 0.5em;
            border-radius: 0.25em;
            overflow-x: auto;
          }
          
          /* General content */
          .ProseMirror p {
            margin-top: 1em;
            margin-bottom: 1em;
          }
        `}</style>
        
        <EditorContent 
          editor={editor} 
          className={cn(
            "prose prose-stone dark:prose-invert prose-headings:mt-4 prose-headings:mb-2",
            "max-w-none h-full flex-1 focus:outline-none",
            fontSizeClass
          )}
        />
        
        {/* Word Count Footer */}
        <div className="text-xs text-muted-foreground mt-2 text-right">
          {wordCount.words} words · {wordCount.characters} characters
        </div>
      </div>
    </div>
  );
}