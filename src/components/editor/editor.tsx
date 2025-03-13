// src/components/editor/editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';

import { useEffect, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { useSettingsStore } from '@/store/setting-store';
import EditorToolbar from './editor-toolbar';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils/utils';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Editor() {
  const { currentNote, updateNote, saveNote } = useNoteStore();
  const { autoSave, fontSize } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });

  // Define extensions with extended features
  const extensions = [
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
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Placeholder.configure({
      placeholder: 'Start typing your notes here...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    Image,
  ];

  // Set up Tiptap editor with advanced extensions
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
              }}
              type="text"
            />
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
          /* Enhanced custom editor styles */
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
            color: #333;
          }
          .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            color: #444;
          }
          .ProseMirror h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 1em;
            color: #555;
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
          
          /* Task Lists */
          .ProseMirror ul[data-type="taskList"] {
            list-style: none;
            padding: 0;
          }
          .ProseMirror ul[data-type="taskList"] li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.5em;
          }
          .ProseMirror ul[data-type="taskList"] li[data-checked="true"] {
            text-decoration: line-through;
            color: #888;
          }
          
          /* Blockquote */
          .ProseMirror blockquote {
            border-left: 3px solid #b8b8b8;
            padding-left: 1em;
            margin-left: 0;
            margin-right: 0;
            font-style: italic;
            color: #555;
          }
          
          /* Code block */
          .ProseMirror pre {
            background-color: #f5f5f5;
            padding: 0.75em 1em;
            border-radius: 0.5em;
            overflow-x: auto;
            margin: 1em 0;
            font-family: monospace;
          }
          
          /* Inline code */
          .ProseMirror code {
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 0.25em;
            font-family: monospace;
            font-size: 0.9em;
          }
          
          /* Tables */
          .ProseMirror table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            margin: 1em 0;
            overflow: hidden;
          }
          .ProseMirror table td,
          .ProseMirror table th {
            border: 2px solid #ddd;
            padding: 8px;
            min-width: 100px;
            position: relative;
          }
          .ProseMirror table th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: #f8f8f8;
            color: #333;
            font-weight: bold;
          }
          
          /* Images */
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
            border-radius: 4px;
          }
          
          /* Text alignment */
          .ProseMirror .text-left {
            text-align: left;
          }
          .ProseMirror .text-center {
            text-align: center;
          }
          .ProseMirror .text-right {
            text-align: right;
          }
          .ProseMirror .text-justify {
            text-align: justify;
          }
          
          /* General content */
          .ProseMirror p {
            margin-top: 1em;
            margin-bottom: 1em;
            line-height: 1.5;
          }
          
          /* Focus styles */
          .ProseMirror:focus {
            outline: none;
          }
          
          /* Links */
          .ProseMirror a {
            color: #2563eb;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          
          /* Placeholder text */
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
          
          /* Text selection */
          .ProseMirror::selection {
            background: rgba(46, 170, 220, 0.2);
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