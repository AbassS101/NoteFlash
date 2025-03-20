// src/components/editor/editor.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useNoteStore } from '@/store/note-store';
import { useParams, useSearchParams } from 'next/navigation';
import { EditorToolbar } from './editor-toolbar';
import { useSettingsStore } from '@/store/setting-store';
import { debounce } from '@/lib/utils/debounce';

interface EditorProps {
  noteId?: string;
}

const Editor: React.FC<EditorProps> = ({ noteId }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const idFromParams = params?.id as string;
  const idFromSearch = searchParams?.get('id');
  const currentNoteId = noteId || idFromParams || idFromSearch;
  
  const { notes, currentNote, setCurrentNote, saveNote } = useNoteStore();
  const { autoSave, fontSize } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  // Find note if ID is provided but no current note is set
  useEffect(() => {
    if (currentNoteId && (!currentNote || currentNote.id !== currentNoteId)) {
      const note = notes.find(n => n.id === currentNoteId);
      if (note) {
        setCurrentNote(note);
      }
    }
  }, [currentNoteId, currentNote, notes, setCurrentNote]);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        validate: href => /^https?:\/\//.test(href),
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
    ],
    content: currentNote?.content || '',
    onUpdate: ({ editor }) => {
      if (currentNote) {
        setCurrentNote({
          ...currentNote,
          content: editor.getHTML(),
        });
        
        // Auto-save if enabled
        if (autoSave) {
          debouncedSave();
        }
      }
    },
  });

  // Update editor content when note changes
  useEffect(() => {
    if (editor && currentNote) {
      if (editor.getHTML() !== currentNote.content) {
        editor.commands.setContent(currentNote.content || '');
      }
    }
  }, [editor, currentNote]);

  // Set editor font size based on settings
  useEffect(() => {
    const fontSizeMap = {
      small: '0.9rem',
      medium: '1rem',
      large: '1.1rem',
    };
    
    if (editor && fontSize) {
      const size = fontSizeMap[fontSize as keyof typeof fontSizeMap] || '1rem';
      editor.setOptions({
        editorProps: {
          attributes: {
            style: `font-size: ${size}`,
          },
        },
      });
    }
  }, [editor, fontSize]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async () => {
      if (currentNote) {
        setIsSaving(true);
        await saveNote();
        setIsSaving(false);
      }
    }, 1000),
    [currentNote, saveNote]
  );

  // Handle manual save
  const handleSave = async () => {
    setIsSaving(true);
    await saveNote();
    setIsSaving(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // If no note is selected
  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-muted-foreground text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">No note selected</h2>
          <p className="max-w-md mx-auto">
            Select a note from the sidebar or create a new note to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorToolbar editor={editor} isSaving={isSaving} onSave={handleSave} />
      
      <div className="flex-1 overflow-auto p-4">
        <div className={`prose prose-${fontSize} max-w-none dark:prose-invert min-h-[calc(100vh-12rem)]`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default Editor;